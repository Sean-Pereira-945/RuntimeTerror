import torch

class FLServer:
    def __init__(self, model, device='cpu'):
        self.global_model = model.to(device)
        self.device = device
        
    def evaluate(self, test_loader):
        """
        Evaluate the global model on the test dataset.
        """
        self.global_model.eval()
        test_loss = 0
        correct = 0
        criterion = torch.nn.CrossEntropyLoss(reduction='sum')
        
        with torch.no_grad():
            for data, target in test_loader:
                data, target = data.to(self.device), target.to(self.device)
                output = self.global_model(data)
                test_loss += criterion(output, target).item()
                pred = output.argmax(dim=1, keepdim=True)
                correct += pred.eq(target.view_as(pred)).sum().item()

        test_loss /= len(test_loader.dataset)
        accuracy = 100. * correct / len(test_loader.dataset)
        
        return test_loss, accuracy
