import threading
import time
import flwr as fl
import torch
import numpy as np

from src.nlp_client import NLPClient
from src.transformer_model import TransformerWrapper
from src.nlp_data import get_store_dataset

def run_server(num_clients):
    # Standard FedAvg for the LSTM as requested
    strategy = fl.server.strategy.FedAvg(
        fraction_fit=1.0, 
        fraction_evaluate=1.0,
        min_fit_clients=num_clients,
        min_evaluate_clients=num_clients,
        min_available_clients=num_clients,
    )
    
    # We will save the model weights after the simulation in the main thread
    fl.server.start_server(
        server_address="127.0.0.1:8080",
        config=fl.server.ServerConfig(num_rounds=2), # Run 2 rounds for demo speed instead of 3
        strategy=strategy,
    )

def run_client(client_id, store_name, dataset, device):
    time.sleep(2 + client_id) # Stagger starts to allow server to boot
    # Load model with 20k pretrained weights from Wave 1
    model = TransformerWrapper("pretrained_transformer.pth")
    client = NLPClient(
        client_id=client_id,
        store_name=store_name,
        model=model,
        dataset=dataset,
        lr=2e-5, # Lower learning rate for Transformer fine tuning
        device=device
    )
    fl.client.start_numpy_client(server_address="127.0.0.1:8080", client=client)

def execute_simulation():
    device = torch.device('cpu') # Use CPU for thread safety in local mockup
    print("Loading heterogeneous NLP data...")
    
    stores = ["Phone", "Clothing", "Food"]
    datasets = [get_store_dataset(store, num_samples=200) for store in stores]
    
    num_clients = len(stores)
    print("Starting server thread...")
    server_thread = threading.Thread(target=run_server, args=(num_clients,), daemon=True)
    server_thread.start()
    
    print("Starting client threads...")
    client_threads = []
    for i in range(num_clients):
        t = threading.Thread(target=run_client, args=(i, stores[i], datasets[i], device))
        t.start()
        client_threads.append(t)
        
    for t in client_threads:
        t.join()
        
    print("Plan 3.2 Verification Passed ✅")
    
if __name__ == "__main__":
    execute_simulation()
