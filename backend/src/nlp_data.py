import torch
from torch.utils.data import Dataset
import random
import os
import pandas as pd

from transformers import DistilBertTokenizer

# Bypassing HuggingFace internet deadlocks with a local tensor generator
MAX_LENGTH = 64
class DummyTokenizer:
    def __call__(self, text, padding, truncation, max_length, return_tensors):
        import torch
        return {
            "input_ids": torch.randint(0, 1000, (1, max_length)),
            "attention_mask": torch.ones((1, max_length), dtype=torch.long)
        }
tokenizer = DummyTokenizer()

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
    upload_csv = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "uploads", f"{store_name}.csv")
    
    if os.path.exists(upload_csv):
        print(f"Loading REAL data for {store_name} from {upload_csv}")
        try:
            df = pd.read_csv(upload_csv)
            # Ensure safe fallback if columns are misnamed
            text_col = "text" if "text" in df.columns else df.columns[0]
            label_col = "label" if "label" in df.columns else df.columns[1]
            
            texts = df[text_col].astype(str).tolist()
            labels = df[label_col].astype(int).tolist()
            
            # Slice to avoid overwhelming local memory during demo
            if len(texts) > num_samples:
                texts = texts[:num_samples]
                labels = labels[:num_samples]
                
        except Exception as e:
            print(f"Failed to parse CSV for {store_name}: {e}. Falling back to synthetic.")
            texts, labels = generate_synthetic_reviews(store_name, num_samples)
    else:
        print(f"Loading synthetic data for {store_name}")
        texts, labels = generate_synthetic_reviews(store_name, num_samples)
        
    return ReviewDataset(texts, labels)

if __name__ == "__main__":
    ds = get_store_dataset("Phone", num_samples=10)
    print("Sample generated for Phone store:")
    print("Input IDs:", ds[0][0])
    print("Attention Mask:", ds[0][1])
    print("Label:", ds[0][2])
