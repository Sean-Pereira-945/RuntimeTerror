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


# ── Rich template bank for synthetic reviews ──────────────────────────
_ADJECTIVES_POS = ["amazing", "fantastic", "wonderful", "excellent", "superb",
                   "outstanding", "brilliant", "incredible", "perfect", "great"]
_ADJECTIVES_NEG = ["terrible", "horrible", "awful", "dreadful", "abysmal",
                   "pathetic", "disgusting", "horrendous", "atrocious", "lousy"]

_POSITIVE_TEMPLATES = [
    "I absolutely love this {item}. It is {adj}!",
    "This {item} is {adj} and works perfectly every day.",
    "Best {item} I have ever purchased. Totally {adj}.",
    "Very satisfied with this {item}. The quality is {adj}.",
    "{adj} value for money. This {item} exceeded my expectations.",
    "I would recommend this {item} to everyone. Simply {adj}.",
    "Really happy with my new {item}. Performance is {adj}.",
    "Five stars for this {item}! Everything about it is {adj}.",
    "This {item} changed my life. The experience was {adj}.",
    "Can't stop using this {item}. The design is {adj}.",
    "I bought this {item} for my family and they all think it is {adj}.",
    "After months of use this {item} still feels {adj}.",
    "Shipping was fast and the {item} itself is truly {adj}.",
    "High quality materials make this {item} genuinely {adj}.",
    "Customer service was helpful and the {item} arrived in {adj} condition.",
]

_NEGATIVE_TEMPLATES = [
    "I hate this {item}. It is {adj}.",
    "Worst {item} ever. The quality is {adj}. Do not buy.",
    "This {item} broke after one day. Absolutely {adj}.",
    "{adj} experience with this {item}. Total waste of money.",
    "The {item} is so {adj} I want a refund immediately.",
    "I regret buying this {item}. Build quality is {adj}.",
    "Do not waste your money on this {item}. It is {adj}.",
    "This {item} does not work at all. Performance is {adj}.",
    "Returned this {item} the same day. Everything about it is {adj}.",
    "I waited weeks for this {item} and it was {adj}.",
    "The packaging was damaged and the {item} inside was even more {adj}.",
    "Save yourself the trouble, this {item} is genuinely {adj}.",
    "My old {item} was better than this {adj} replacement.",
    "I expected more from this {item} but it is just {adj}.",
    "This {item} stopped working in a week. Truly {adj} craftsmanship.",
]

_ITEM_MAP = {
    "Phone": ["phone", "smartphone", "cell phone", "mobile phone", "handset"],
    "Clothing": ["shirt", "jacket", "dress", "outfit", "sweater"],
    "Food": ["meal", "dish", "snack", "recipe", "food box"],
}


def generate_synthetic_reviews(store_name, num_samples=1000):
    """Generate diverse synthetic reviews with random adjective + item combinations."""
    items = _ITEM_MAP.get(store_name, ["product", "item", "purchase"])
    texts = []
    labels = []

    for _ in range(num_samples // 2):
        # Positive sample
        tmpl = random.choice(_POSITIVE_TEMPLATES)
        texts.append(tmpl.format(item=random.choice(items), adj=random.choice(_ADJECTIVES_POS)))
        labels.append(1)

        # Negative sample
        tmpl = random.choice(_NEGATIVE_TEMPLATES)
        texts.append(tmpl.format(item=random.choice(items), adj=random.choice(_ADJECTIVES_NEG)))
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
