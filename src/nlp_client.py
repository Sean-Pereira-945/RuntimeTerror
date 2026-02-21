import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import flwr as fl
from collections import OrderedDict
import random

class NLPClient(fl.client.NumPyClient):
    def __init__(self, client_id, store_name, model, dataset, batch_size=32, lr=0.01, device='cpu'):
        self.client_id = client_id
        self.store_name = store_name
        self.device = device
        self.lr = lr
        self.batch_size = batch_size
        self.model = model.to(self.device)
        self.dataset = dataset
        self.dataloader = DataLoader(self.dataset, batch_size=batch_size, shuffle=True)
        
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
        
        # Asynchronous/Random Epoch simulation (Requirement #3)
        # We ignore config["epochs"] and pick randomly between 2 and 5.
        epochs = random.randint(2, 5)
        print(f"[Client {self.store_name}] Training for {epochs} epochs...")
        
        self.train(epochs)
        return self.get_parameters(config={}), len(self.dataset), {}
        
    def evaluate(self, parameters, config):
        """Set model parameters, evaluate model on its local data."""
        self.set_parameters(parameters)
        loss, accuracy = self.eval_model()
        return loss, len(self.dataset), {"accuracy": accuracy}
        
    def train(self, epochs):
        """Train the model locally."""
        self.model.train()
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(self.model.parameters(), lr=self.lr)
        
        for epoch in range(epochs):
            for input_ids, attention_mask, target in self.dataloader:
                input_ids, attention_mask, target = input_ids.to(self.device), attention_mask.to(self.device), target.to(self.device)
                optimizer.zero_grad()
                output = self.model(input_ids, attention_mask)
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
            for input_ids, attention_mask, target in self.dataloader:
                input_ids, attention_mask, target = input_ids.to(self.device), attention_mask.to(self.device), target.to(self.device)
                output = self.model(input_ids, attention_mask)
                loss += criterion(output, target).item()
                pred = output.argmax(dim=1, keepdim=True)
                correct += pred.eq(target.view_as(pred)).sum().item()
        
        
        loss /= len(self.dataset)
        accuracy = correct / len(self.dataset)
        return float(loss), float(accuracy)
