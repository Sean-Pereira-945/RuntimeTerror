import torch
import copy
from src.model import SimpleCNN
from src.data import get_dataset, partition_data
from src.client import FLClient
from src.server import FLServer
from torch.utils.data import DataLoader

if __name__ == "__main__":
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # 1. Setup mock data
    train_dataset, test_dataset = get_dataset(download=False)
    test_loader = DataLoader(test_dataset, batch_size=1000, shuffle=False)
    
    partitions = partition_data(train_dataset, num_clients=2, alpha=1.0)
    
    # 2. Setup server and model
    global_model = SimpleCNN()
    server = FLServer(global_model, device=device)
    
    initial_loss, initial_acc = server.evaluate(test_loader)
    print(f"Initial Server Model - Loss: {initial_loss:.4f}, Accuracy: {initial_acc:.2f}%")
    
    # 3. Setup client and train
    client = FLClient(client_id=0, dataset=train_dataset, indices=partitions[0], lr=0.01, device=device)
    
    # Copy global model to client
    client_model = copy.deepcopy(global_model)
    print("Training client 0 for 1 epoch...")
    updated_state_dict = client.train(client_model, epochs=1)
    
    # Check if weights changed
    weights_changed = False
    for key in updated_state_dict:
        if not torch.allclose(updated_state_dict[key], global_model.state_dict()[key], atol=1e-5):
            weights_changed = True
            break
            
    print(f"Client model weights changed: {weights_changed}")
    assert weights_changed, "Client training failed: weights did not change"
    print("Plan 1.2 Verification Passed ✅")
