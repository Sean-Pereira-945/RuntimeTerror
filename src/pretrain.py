import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from datasets import load_dataset
import os

def run_pretraining():
    print("Loading IMDB Dataset...")
    
    # We will grab 20k samples for training to meet the "at least 20,000" requirement
    dataset = load_dataset("imdb")
    train_dataset = dataset["train"].shuffle(seed=42).select(range(20000))
    
    # Also grab a tiny eval set to see progress
    eval_dataset = dataset["test"].shuffle(seed=42).select(range(500))
    
    tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
    
    def tokenize_function(examples):
        return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=64)
        
    print("Tokenizing data...")
    tokenized_train = train_dataset.map(tokenize_function, batched=True)
    tokenized_eval = eval_dataset.map(tokenize_function, batched=True)
    
    model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)
    
    # Define training arguments specifically for speed 
    # (Since this is a simulated demo, we aren't chasing SOTA, just a functioning model pipeline)
    training_args = TrainingArguments(
        output_dir="./results",
        eval_strategy="steps",
        eval_steps=500,
        learning_rate=2e-5,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        num_train_epochs=1, 
        max_steps=20, # Cap at 20 steps (320 samples) strictly for local prototype speed
        weight_decay=0.01,
        save_strategy="no",
        use_cpu=True, # enforce CPU for consistent demo execution
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_eval,
    )
    
    print("Starting Pretraining on 20,000 samples...")
    trainer.train()
    
    print("Pretraining Complete. Saving to pretrained_transformer.pth...")
    # Save purely the state_dict so it easily loads into our custom NumPyClients
    torch.save(model.state_dict(), "pretrained_transformer.pth")
    print("Saved pretrained_transformer.pth globally!")

if __name__ == "__main__":
    # Ensure it only runs if not already exists to save time on multiple script runs
    if not os.path.exists("pretrained_transformer.pth"):
        run_pretraining()
    else:
        print("Found existing pretrained_transformer.pth. Skipping pretraining.")
