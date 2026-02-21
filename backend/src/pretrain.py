import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from datasets import load_dataset
import os
import sys

# Resolve paths relative to the backend/ directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRETRAINED_PATH = os.path.join(BACKEND_DIR, "pretrained_transformer.pth")

def run_pretraining():
    print("Loading IMDB Dataset...")
    
    dataset = load_dataset("imdb")
    train_dataset = dataset["train"].shuffle(seed=42).select(range(20000))
    eval_dataset = dataset["test"].shuffle(seed=42).select(range(500))
    
    tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
    
    def tokenize_function(examples):
        return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=64)
        
    print("Tokenizing data...")
    tokenized_train = train_dataset.map(tokenize_function, batched=True)
    tokenized_eval = eval_dataset.map(tokenize_function, batched=True)
    
    model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)
    
    # 500 steps (~5 min on CPU) — enough to get real signal for a demo
    training_args = TrainingArguments(
        output_dir=os.path.join(BACKEND_DIR, "results"),
        eval_strategy="steps",
        eval_steps=250,
        learning_rate=2e-5,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        num_train_epochs=1, 
        max_steps=500,
        weight_decay=0.01,
        save_strategy="no",
        logging_steps=50,
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_eval,
    )
    
    print(f"Starting Pretraining for {training_args.max_steps} steps...")
    trainer.train()
    
    # Save as bare DistilBert state_dict — TransformerWrapper.__init__ loads into self.model
    print(f"Pretraining Complete. Saving to {PRETRAINED_PATH}...")
    torch.save(model.state_dict(), PRETRAINED_PATH)
    print("Saved pretrained_transformer.pth!")

if __name__ == "__main__":
    if "--force" in sys.argv or not os.path.exists(PRETRAINED_PATH):
        run_pretraining()
    else:
        print(f"Found existing {PRETRAINED_PATH}. Skipping pretraining. Use --force to retrain.")
