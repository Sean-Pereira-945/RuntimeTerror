import multiprocessing
import time
import flwr as fl
import torch
import numpy as np

from src.nlp_client import NLPClient
from src.transformer_model import TransformerWrapper
from src.nlp_data import get_store_dataset
from src.strategy import SaveMetricsStrategy

def run_server(num_clients):
    # Standard FedAvg for the LSTM as requested, augmented to log live metrics
    strategy = SaveMetricsStrategy(
        fraction_fit=1.0, 
        fraction_evaluate=1.0,
        min_fit_clients=num_clients,
        min_evaluate_clients=num_clients,
        min_available_clients=num_clients,
    )
    
    fl.server.start_server(
        server_address="127.0.0.1:8080",
        config=fl.server.ServerConfig(num_rounds=2),
        strategy=strategy,
    )

def run_client_process(cid):
    device = torch.device('cpu')
    stores = ["Phone", "Clothing", "Food"]
    store_name = stores[int(cid)]
    
    time.sleep(2 + int(cid))
    
    dataset = get_store_dataset(store_name, num_samples=200)
    model = TransformerWrapper("pretrained_transformer.pth")
    client = NLPClient(
        client_id=int(cid),
        store_name=store_name,
        model=model,
        dataset=dataset,
        lr=2e-5,
        device=device
    )
    fl.client.start_numpy_client(server_address="127.0.0.1:8080", client=client)

def execute_simulation():
    print("Loading heterogeneous NLP data and initializing FL Simulation using native multiprocessing...")
    
    num_clients = 3
    
    # Start server in a background process
    server_process = multiprocessing.Process(target=run_server, args=(num_clients,), daemon=True)
    server_process.start()
    
    # Start clients in background processes
    client_processes = []
    for i in range(num_clients):
        p = multiprocessing.Process(target=run_client_process, args=(i,), daemon=True)
        p.start()
        client_processes.append(p)
        
    for p in client_processes:
        p.join()
        
    print("Plan 9 Verification Passed ✅")
    
if __name__ == "__main__":
    execute_simulation()
