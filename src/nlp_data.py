import torch
from torch.utils.data import Dataset
import random

# Fixed vocabulary size for the simplistic tokenizer
VOCAB_SIZE = 1000
MAX_LENGTH = 50

class ReviewDataset(Dataset):
    def __init__(self, texts, labels, max_length=MAX_LENGTH):
        self.texts = texts
        self.labels = labels
        self.max_length = max_length

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        # A very basic hashing tokenizer
        tokens = [abs(hash(word)) % VOCAB_SIZE for word in self.texts[idx].split()]
        
        # Pad or truncate
        if len(tokens) > self.max_length:
            tokens = tokens[:self.max_length]
        else:
            tokens = tokens + [0] * (self.max_length - len(tokens))
            
        return torch.tensor(tokens, dtype=torch.long), torch.tensor(self.labels[idx], dtype=torch.long)

def generate_synthetic_reviews(store_name, num_samples=1000):
    positive_templates = [
        "I absolutely love this {}.",
        "This {} is amazing and works perfectly.",
        "Great quality {}. Highly recommend.",
        "Best {} I have ever purchased.",
        "Very satisfied with this {}."
    ]
    negative_templates = [
        "I hate this {}. It is terrible.",
        "Worst {} ever. Do not buy.",
        "This {} broke immediately.",
        "Awful experience with this {}.",
        "The {} is very poor quality."
    ]
    
    item_type = ""
    if store_name == "Phone":
        item_type = "phone"
    elif store_name == "Clothing":
        item_type = "shirt"
    elif store_name == "Food":
        item_type = "meal"
        
    texts = []
    labels = []
    
    # 50% positive (label 1), 50% negative (label 0)
    for _ in range(num_samples // 2):
        texts.append(random.choice(positive_templates).format(item_type))
        labels.append(1)
        
        texts.append(random.choice(negative_templates).format(item_type))
        labels.append(0)
        
    combined = list(zip(texts, labels))
    random.shuffle(combined)
    texts, labels = zip(*combined)
    
    return list(texts), list(labels)

def get_store_dataset(store_name, num_samples=1000):
    texts, labels = generate_synthetic_reviews(store_name, num_samples)
    return ReviewDataset(texts, labels)

if __name__ == "__main__":
    ds = get_store_dataset("Phone", num_samples=10)
    print("Sample generated for Phone store:")
    print("Tokens:", ds[0][0])
    print("Label:", ds[0][1])
