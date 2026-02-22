import multiprocessing
import time
import json
import flwr as fl
import torch
import os

from src.nlp_client import NLPClient
from src.transformer_model import TransformerWrapper
from src.nlp_data import get_store_dataset
from src.strategy import SaveMetricsStrategy

# Resolve paths relative to backend/ directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRETRAINED_PATH = os.path.join(BACKEND_DIR, "pretrained_transformer.pth")
STATUS_FILE = os.path.join(BACKEND_DIR, "data", "training_status.json")

NUM_ROUNDS = 10
SERVER_ADDRESS = "127.0.0.1:8080"


def _write_status(status: str, **extra):
    """Write training status to a JSON file for the API to read."""
    os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)
    data = {"status": status, "ts": time.time(), **extra}
    with open(STATUS_FILE, "w") as f:
        json.dump(data, f)

def run_server(num_clients, server_address, num_rounds):
    strategy = SaveMetricsStrategy(
        fraction_fit=1.0, 
        fraction_evaluate=1.0,
        min_fit_clients=num_clients,
        min_evaluate_clients=num_clients,
        min_available_clients=num_clients,
    )
    
    fl.server.start_server(
        server_address=server_address,
        config=fl.server.ServerConfig(num_rounds=num_rounds),
        strategy=strategy,
    )

def run_client_process(cid, store_name, server_address):
    device = torch.device('cpu')
    
    dataset = get_store_dataset(store_name, num_samples=200)
    model = TransformerWrapper(PRETRAINED_PATH if os.path.exists(PRETRAINED_PATH) else None)
    client = NLPClient(
        client_id=int(cid) if str(cid).isdigit() else hash(str(cid)) % 10000,
        store_name=store_name,
        model=model,
        dataset=dataset,
        lr=2e-5,
        device=device
    )
    
    # Retry connection with exponential backoff in case the server isn't ready yet
    max_retries = 5
    for attempt in range(max_retries):
        try:
            wait_time = 3 + (hash(str(cid)) % 5) + (attempt * 2)
            print(f"[Client {store_name}] Waiting {wait_time}s before connecting (attempt {attempt + 1}/{max_retries})...")
            time.sleep(wait_time)
            fl.client.start_numpy_client(server_address=server_address, client=client)
            break  # Success
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"[Client {store_name}] Connection failed: {e}. Retrying...")
            else:
                print(f"[Client {store_name}] Failed to connect after {max_retries} attempts: {e}")
                raise

def execute_simulation():
    import argparse
    import socket
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--client-id", type=str, default=None)
    args = parser.parse_args()

    global STATUS_FILE
    
    if args.client_id:
        STATUS_FILE = os.path.join(BACKEND_DIR, "data", f"training_status_{args.client_id}.json")
        final_stores = [args.client_id]
        num_rounds = 1
        num_clients = 1
        
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.bind(('', 0))
        port = s.getsockname()[1]
        s.close()
        server_address = f"127.0.0.1:{port}"
        
        print(f"[Main] Isolated training for client {args.client_id} on port {port}")
    else:
        num_rounds = NUM_ROUNDS
        server_address = SERVER_ADDRESS
        
        # ── Discover Data (Database-First) ─────────────────────────────────
        from src.database import get_client_dataset_stats
        db_stats = get_client_dataset_stats()
        discovered_stores = [s.strip() for s in db_stats.keys() if s.strip()]
        print(f"[Main] Discovered from DB: {discovered_stores}")
        
        # We also check filesystem as fallback for legacy uploads
        upload_dir = os.path.join(BACKEND_DIR, "data", "uploads")
        discovered_from_fs = []
        if os.path.isdir(upload_dir):
            for f in os.listdir(upload_dir):
                if f.endswith(".csv") and not f.startswith('.'):
                    sid = f.replace(".csv", "").strip()
                    if sid and sid not in discovered_stores:
                        discovered_stores.append(sid)
                        discovered_from_fs.append(sid)
                        print(f"[Main] Found uploaded dataset in FS: {sid}")
        
        if discovered_from_fs:
            print(f"[Main] Added filesystem uploads to trainable stores: {discovered_from_fs}")
        
        # We want at least 3 clients for the simulation feel.
        # We use discovered ones first, then fill with defaults if needed.
        defaults = ["Phone", "Clothing", "Food"]
        final_stores = discovered_stores[:3]
        print(f"[Main] Stores after discovery: {final_stores}")
        
        # Only use defaults if discovery found nothing at all
        if not discovered_stores:
            print("[Main] No user datasets found. Using synthetic defaults.")
            while len(final_stores) < 3:
                for d in defaults:
                    if d not in final_stores:
                        final_stores.append(d)
                        if len(final_stores) >= 3: break
        else:
            # Fill remaining slots from defaults only if needed
            while len(final_stores) < 3:
                for d in defaults:
                    if d not in final_stores:
                        final_stores.append(d)
                        if len(final_stores) >= 3: break
        
        print(f"[Main] Final training stores: {final_stores}")
        num_clients = len(final_stores)

    print(f"Starting FL Simulation: {num_rounds} rounds, {num_clients} clients, server at {server_address}")
    print(f"Participating stores: {', '.join(final_stores)}")
    
    _write_status("running", currentRound=0, totalRounds=num_rounds, message=f"Launching {num_clients} simulation processes...")
    
    # Calculate max timeout (2 minutes per round + 30s buffer)
    max_training_time = (num_rounds * 120) + 30
    
    # Start server in a background process
    server_process = multiprocessing.Process(target=run_server, args=(num_clients, server_address, num_rounds))
    server_process.daemon = False  # Ensure clean shutdown
    server_process.start()
    
    # Start clients in separate processes
    client_processes = []
    for i, store_name in enumerate(final_stores):
        p = multiprocessing.Process(target=run_client_process, args=(i, store_name, server_address))
        p.daemon = False  # Ensure clean shutdown
        p.start()
        client_processes.append(p)
        
    # Wait for all clients to finish with timeout
    print(f"[Main] Waiting for clients to complete (timeout: {max_training_time}s)...")
    for p in client_processes:
        p.join(timeout=max_training_time)
        if p.is_alive():
            print(f"[Main] WARNING: Client process still alive after timeout. Terminating...")
            p.terminate()
            p.join(timeout=5)
    
    # Wait for the server to finish its final round with timeout
    print("[Main] Waiting for server to finalize...")
    server_process.join(timeout=60)
    if server_process.is_alive():
        print("[Main] WARNING: Server process still running after 60s, terminating...")
        server_process.terminate()
        server_process.join(timeout=10)
        if server_process.is_alive():
            print("[Main] ERROR: Server failed to terminate. Force killing...")
            server_process.kill()
            server_process.join()
    
    _write_status("completed", currentRound=num_rounds, totalRounds=num_rounds, message="All rounds complete!")
    print(f"FL Simulation Complete! {num_rounds} rounds finished. ✅")
    
if __name__ == "__main__":
    execute_simulation()
    
if __name__ == "__main__":
    execute_simulation()
