import numpy as np
import torch
from torchvision import datasets, transforms

def get_dataset(data_dir='./data', download=True):
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])
    train_dataset = datasets.MNIST(data_dir, train=True, download=download, transform=transform)
    test_dataset = datasets.MNIST(data_dir, train=False, download=download, transform=transform)
    return train_dataset, test_dataset

def partition_data(dataset, num_clients, alpha=0.5):
    """
    Partition the data in a non-IID fashion using a Dirichlet distribution over labels.
    """
    try:
        labels = np.array(dataset.targets)
    except AttributeError:
        labels = np.array([y for x, y in dataset])
        
    num_classes = len(np.unique(labels))
    client_idcs = {i: np.array([], dtype='int64') for i in range(num_clients)}
    
    # Generate Dirichlet distribution for each class
    class_distribution = np.random.dirichlet([alpha] * num_clients, num_classes)
    
    for k in range(num_classes):
        idx_k = np.where(labels == k)[0]
        np.random.shuffle(idx_k)
        
        proportions = class_distribution[k]
        counts = (proportions * len(idx_k)).astype(int)
        
        remainder = len(idx_k) - counts.sum()
        if remainder > 0:
            counts[np.random.choice(num_clients, remainder, replace=False)] += 1
            
        splits = np.split(idx_k, np.cumsum(counts)[:-1])
        
        for i in range(num_clients):
            if len(splits[i]) > 0:
                client_idcs[i] = np.concatenate((client_idcs[i], splits[i]))
                
    for i in range(num_clients):
        np.random.shuffle(client_idcs[i])
        
    return client_idcs

if __name__ == "__main__":
    # Test partition logic
    train_dataset, _ = get_dataset(download=True)
    partitions = partition_data(train_dataset, num_clients=2, alpha=0.1)
    
    for client_id in range(2):
        client_indices = partitions[client_id]
        client_labels = [train_dataset[idx][1] for idx in client_indices]
        unique, counts = np.unique(client_labels, return_counts=True)
        print(f"Client {client_id} data distribution:")
        print(dict(zip(unique, counts)))
