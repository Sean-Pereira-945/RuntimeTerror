import torch
from torch.utils.data import Dataset
import random

from transformers import DistilBertTokenizer

# Fixed vocabulary size for the simplistic tokenizer
# We're now delegating to HuggingFace DistilBertTokenizer
MAX_LENGTH = 64
tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")

class ReviewDataset(Dataset):
    def __init__(self, texts, labels, max_length=MAX_LENGTH):
        self.texts = texts
        self.labels = labels
        self.max_length = max_length

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        # We now use the Transformer pre-trained tokenizer
        encoding = tokenizer(
            self.texts[idx],
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt"
        )
        
        # Squeeze the tensor because tokenizer returns batch dim even for single items
        input_ids = encoding["input_ids"].squeeze(0)
        attention_mask = encoding["attention_mask"].squeeze(0)
        label = torch.tensor(self.labels[idx], dtype=torch.long)
        
        return input_ids, attention_mask, label

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
    print("Input IDs:", ds[0][0])
    print("Attention Mask:", ds[0][1])
    print("Label:", ds[0][2])
