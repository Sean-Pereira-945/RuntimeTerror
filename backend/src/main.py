import multiprocessing
import time
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

NUM_ROUNDS = 10
SERVER_ADDRESS = "127.0.0.1:8080"

def run_server(num_clients):
    strategy = SaveMetricsStrategy(
        fraction_fit=1.0, 
        fraction_evaluate=1.0,
        min_fit_clients=num_clients,
        min_evaluate_clients=num_clients,
        min_available_clients=num_clients,
    )
    
    fl.server.start_server(
        server_address=SERVER_ADDRESS,
        config=fl.server.ServerConfig(num_rounds=NUM_ROUNDS),
        strategy=strategy,
    )

def run_client_process(cid):
    device = torch.device('cpu')
    stores = ["Phone", "Clothing", "Food"]
    store_name = stores[int(cid)]
    
    dataset = get_store_dataset(store_name, num_samples=200)
    model = TransformerWrapper(PRETRAINED_PATH if os.path.exists(PRETRAINED_PATH) else None)
    client = NLPClient(
        client_id=int(cid),
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
            wait_time = 3 + int(cid) + (attempt * 2)
            print(f"[Client {store_name}] Waiting {wait_time}s before connecting (attempt {attempt + 1}/{max_retries})...")
            time.sleep(wait_time)
            fl.client.start_numpy_client(server_address=SERVER_ADDRESS, client=client)
            break  # Success
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"[Client {store_name}] Connection failed: {e}. Retrying...")
            else:
                print(f"[Client {store_name}] Failed to connect after {max_retries} attempts: {e}")
                raise

def execute_simulation():
    print(f"Starting FL Simulation: {NUM_ROUNDS} rounds, 3 clients, server at {SERVER_ADDRESS}")
    
    num_clients = 3
    
    # Start server in a background process
    server_process = multiprocessing.Process(target=run_server, args=(num_clients,))
    server_process.start()
    
    # Start clients in separate processes
    client_processes = []
    for i in range(num_clients):
        p = multiprocessing.Process(target=run_client_process, args=(i,))
        p.start()
        client_processes.append(p)
        
    # Wait for all clients to finish
    for p in client_processes:
        p.join()
    
    # Wait for the server to finish its final round
    server_process.join(timeout=60)
    if server_process.is_alive():
        print("Warning: Server process still running, terminating...")
        server_process.terminate()
        server_process.join(timeout=10)
        
    print(f"FL Simulation Complete! {NUM_ROUNDS} rounds finished. ✅")
    
if __name__ == "__main__":
    execute_simulation()
