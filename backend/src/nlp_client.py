import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import flwr as fl
from collections import OrderedDict
import random

class NLPClient(fl.client.NumPyClient):
    def __init__(self, client_id, store_name, model, dataset, batch_size=16, lr=5e-5, device='cpu', low_compute=False):
        self.client_id = client_id
        self.store_name = store_name
        self.device = device
        self.lr = lr
        self.batch_size = batch_size
        self.model = model.to(self.device)
        self.dataset = dataset
        self.dataloader = DataLoader(self.dataset, batch_size=batch_size, shuffle=True, drop_last=False)
        self.low_compute = low_compute
        
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
        
        if self.low_compute:
            epochs = 2
            print(f"[Client {self.store_name}] Low-Compute Mode Active. Training for 2 epochs...")
        else:
            epochs = 3
            print(f"[Client {self.store_name}] Training for {epochs} epochs...")
        
        self.train(epochs)
        return self.get_parameters(config={}), len(self.dataset), {}
        
    def evaluate(self, parameters, config):
        """Set model parameters, evaluate model on its local data."""
        self.set_parameters(parameters)
        loss, accuracy = self.eval_model()
        return loss, len(self.dataset), {"accuracy": accuracy}
        
    def train(self, epochs):
        """Train the model locally with gradient clipping for stable DistilBERT fine-tuning."""
        self.model.train()
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.AdamW(self.model.parameters(), lr=self.lr, weight_decay=0.01)
        
        for epoch in range(epochs):
            epoch_loss = 0.0
            for input_ids, attention_mask, target in self.dataloader:
                input_ids = input_ids.to(self.device)
                attention_mask = attention_mask.to(self.device)
                target = target.to(self.device)
                optimizer.zero_grad()
                output = self.model(input_ids, attention_mask)
                loss = criterion(output, target)
                loss.backward()
                # Gradient clipping prevents exploding gradients in transformer fine-tuning
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                optimizer.step()
                epoch_loss += loss.item()
            avg_loss = epoch_loss / max(len(self.dataloader), 1)
            print(f"  [{self.store_name}] Epoch {epoch+1}/{epochs} — loss: {avg_loss:.4f}")
                
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
