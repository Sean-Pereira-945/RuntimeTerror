import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import flwr as fl
from collections import OrderedDict

class FLClient(fl.client.NumPyClient):
    def __init__(self, client_id, model, dataset, indices, batch_size=32, lr=0.01, device='cpu'):
        self.client_id = client_id
        self.device = device
        self.lr = lr
        self.batch_size = batch_size
        self.model = model.to(self.device)
        
        # Create a local dataloader for this client's partitioned data
        self.local_dataset = torch.utils.data.Subset(dataset, indices)
        self.dataloader = DataLoader(self.local_dataset, batch_size=batch_size, shuffle=True)
        
    def get_parameters(self, config):
        """Return model weights as a list of NumPy ndarrays."""
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def set_parameters(self, parameters):
        """Set model parameters from a list of NumPy ndarrays."""
        params_dict = zip(self.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        self.model.load_state_dict(state_dict, strict=True)
        
    def fit(self, parameters, config):
        """Set model parameters, train model, return updated model parameters."""
        self.set_parameters(parameters)
        epochs = config.get("epochs", 1)
        self.train(epochs)
        return self.get_parameters(config={}), len(self.local_dataset), {}
        
    def evaluate(self, parameters, config):
        """Set model parameters, evaluate model on its local data."""
        self.set_parameters(parameters)
        loss, accuracy = self.eval_model()
        return loss, len(self.local_dataset), {"accuracy": accuracy}
        
    def train(self, epochs=1):
        """Train the model locally."""
        self.model.train()
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.SGD(self.model.parameters(), lr=self.lr, momentum=0.9)
        
        for epoch in range(epochs):
            for batch_idx, (data, target) in enumerate(self.dataloader):
                data, target = data.to(self.device), target.to(self.device)
                optimizer.zero_grad()
                output = self.model(data)
                loss = criterion(output, target)
                loss.backward()
                optimizer.step()
                
    def eval_model(self):
        """Evaluate the model and return loss and accuracy."""
        self.model.eval()
        loss = 0.0
        correct = 0
        criterion = nn.CrossEntropyLoss(reduction='sum')
        with torch.no_grad():
            for data, target in self.dataloader:
                data, target = data.to(self.device), target.to(self.device)
                output = self.model(data)
                loss += criterion(output, target).item()
                pred = output.argmax(dim=1, keepdim=True)
                correct += pred.eq(target.view_as(pred)).sum().item()
        
        loss /= len(self.local_dataset)
        accuracy = correct / len(self.local_dataset)
        return float(loss), float(accuracy)
