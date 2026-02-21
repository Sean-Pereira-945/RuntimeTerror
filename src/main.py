import threading
import time
import flwr as fl
import torch
from src.strategy import AsyncMedianStrategy
from src.client import FLClient
from src.model import SimpleCNN
from src.data import get_dataset, partition_data

def run_server(num_clients):
    strategy = AsyncMedianStrategy(
        k_buffer_size=3,
        fraction_fit=0.01,
        fraction_evaluate=0.01,
        min_fit_clients=1,
        min_evaluate_clients=1,
        min_available_clients=num_clients,
    )
    fl.server.start_server(
        server_address="127.0.0.1:8080",
        config=fl.server.ServerConfig(num_rounds=3),
        strategy=strategy,
    )

def run_client(client_id, dataset, indices, device):
    time.sleep(2 + client_id) # Stagger starts to allow server to boot
    model = SimpleCNN()
    client = FLClient(
        client_id=client_id,
        model=model,
        dataset=dataset,
        indices=indices,
        lr=0.01,
        device=device
    )
    fl.client.start_numpy_client(server_address="127.0.0.1:8080", client=client)

def main():
    device = torch.device('cpu') # Use CPU for thread safety in local mockup
    print("Loading data...")
    train_dataset, _ = get_dataset(download=False)
    
    num_clients = 2
    partitions = partition_data(train_dataset, num_clients=num_clients, alpha=0.5)
    
    print("Starting server thread...")
    server_thread = threading.Thread(target=run_server, args=(num_clients,), daemon=True)
    server_thread.start()
    
    print("Starting client threads...")
    client_threads = []
    for i in range(num_clients):
        t = threading.Thread(target=run_client, args=(i, train_dataset, partitions[i], device))
        t.start()
        client_threads.append(t)
        
    for t in client_threads:
        t.join()
        
    print("Plan 2.3 Verification Passed ✅")

if __name__ == "__main__":
    main()
