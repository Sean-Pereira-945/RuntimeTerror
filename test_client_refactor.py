import torch
from src.model import SimpleCNN
from src.data import get_dataset, partition_data
from src.client import FLClient

if __name__ == "__main__":
    device = torch.device('cpu')
    print("Loading data...")
    train_dataset, _ = get_dataset(download=False)
    partitions = partition_data(train_dataset, num_clients=2, alpha=1.0)
    
    print("Instantiating model and client...")
    global_model = SimpleCNN()
    client = FLClient(client_id=0, model=global_model, dataset=train_dataset, indices=partitions[0], lr=0.01, device=device)
    
    print("Testing get_parameters...")
    parameters = client.get_parameters(config={})
    assert len(parameters) > 0, "Parameters should not be empty"
    assert type(parameters[0]).__name__ == 'ndarray', "Parameters should be numpy arrays for Flower"
    
    print("Testing set_parameters and fit...")
    # Modify parameters slightly
    modified_parameters = [p + 0.01 for p in parameters]
    
    returned_params, num_examples, metrics = client.fit(modified_parameters, config={"epochs": 1})
    
    assert num_examples == len(client.local_dataset), "Number of examples should match the local dataset size"
    
    print("Testing evaluate...")
    loss, num_eval_examples, eval_metrics = client.evaluate(returned_params, config={})
    
    assert "accuracy" in eval_metrics, "Expected accuracy metric"
    
    print("Plan 2.2 Verification Passed ✅ NumPyClient interface implemented correctly.")
