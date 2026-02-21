import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset

class FLClient:
    def __init__(self, client_id, dataset, indices, batch_size=32, lr=0.01, device='cpu'):
        self.client_id = client_id
        self.device = device
        self.lr = lr
        self.batch_size = batch_size
        
        # Create a local dataloader for this client's partitioned data
        self.local_dataset = torch.utils.data.Subset(dataset, indices)
        self.dataloader = DataLoader(self.local_dataset, batch_size=batch_size, shuffle=True)
        
    def train(self, model, epochs=1):
        """
        Train the model locally for a given number of epochs.
        """
        model.to(self.device)
        model.train()
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.SGD(model.parameters(), lr=self.lr, momentum=0.9)
        
        for epoch in range(epochs):
            for batch_idx, (data, target) in enumerate(self.dataloader):
                data, target = data.to(self.device), target.to(self.device)
                optimizer.zero_grad()
                output = model(data)
                loss = criterion(output, target)
                loss.backward()
                optimizer.step()
                
        return model.state_dict()
