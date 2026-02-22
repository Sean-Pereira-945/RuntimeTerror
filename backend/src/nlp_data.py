import torch
from torch.utils.data import Dataset
import random
import os
import pandas as pd

from transformers import DistilBertTokenizer

MAX_LENGTH = 64
# Use the real DistilBERT tokenizer so training learns actual text→sentiment mapping
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
    
    item_type = "product"  # default fallback
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
    from src.database import get_client_dataset
    print(f"[DataLoader] Initializing for client: '{store_name}'")
    
    # Try reaching the database first
    print(f"[Client {store_name}] DYNAMIC DISCOVERY: Fetching data from DATABASE...")
    try:
        db_rows = get_client_dataset(store_name, limit=num_samples)
        if db_rows:
            print(f"[Client {store_name}] SUCCESS: Loaded {len(db_rows)} rows from DB.")
            texts = [r["text"] for r in db_rows]
            labels = [r["label"] for r in db_rows]
            return ReviewDataset(texts, labels)
    except Exception as e:
        print(f"[Client {store_name}] DATABASE ERROR: {e}")

    # Fallback to filesystem uploads
    print(f"[Client {store_name}] DYNAMIC DISCOVERY: No database records found. Checking filesystem...")
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    upload_dir = os.path.join(backend_dir, "data", "uploads")
    csv_path = os.path.join(upload_dir, f"{store_name}.csv")
    
    if os.path.isfile(csv_path):
        try:
            print(f"[Client {store_name}] Found uploaded CSV: {csv_path}")
            for enc in ("utf-8", "utf-16", "latin-1"):
                try:
                    df = pd.read_csv(csv_path, encoding=enc)
                    print(f"[Client {store_name}] SUCCESS: Loaded {len(df)} rows from CSV file.")
                    # Limit to requested num_samples
                    if len(df) > num_samples:
                        df = df.sample(n=num_samples, random_state=42)
                    texts = df["text"].tolist() if "text" in df.columns else df.iloc[:, 0].tolist()
                    labels = df["label"].tolist() if "label" in df.columns else df.iloc[:, 1].tolist()
                    return ReviewDataset(texts, labels)
                except (UnicodeDecodeError, UnicodeError):
                    continue
            print(f"[Client {store_name}] Could not decode CSV file. Falling back to synthetic.")
        except Exception as e:
            print(f"[Client {store_name}] CSV LOAD ERROR: {e}. Falling back to synthetic.")
    else:
        print(f"[Client {store_name}] No CSV found at {csv_path}")

    # Final fallback to synthetic data
    print(f"[Client {store_name}] Using synthetic data as final fallback.")
    texts, labels = generate_synthetic_reviews(store_name, num_samples)
    return ReviewDataset(texts, labels)

if __name__ == "__main__":
    ds = get_store_dataset("Phone", num_samples=10)
    print("Sample generated for Phone store:")
    print("Input IDs:", ds[0][0])
    print("Attention Mask:", ds[0][1])
    print("Label:", ds[0][2])
