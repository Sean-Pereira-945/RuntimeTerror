import torch
from transformers import DistilBertTokenizer
from src.transformer_model import TransformerWrapper
import os

# Resolve paths relative to the backend/ directory (not CWD)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GLOBAL_MODEL_PATH = os.path.join(BACKEND_DIR, "global_model.pth")
PRETRAINED_PATH = os.path.join(BACKEND_DIR, "pretrained_transformer.pth")

# "Server-Side" API boundary
# The Streamlit/FastAPI client should only call `predict_sentiment` and never load weights explicitly.

# We load the weights once when the server boots
if os.path.exists(GLOBAL_MODEL_PATH):
    # global_model.pth was saved via TransformerWrapper.state_dict() (keys include 'model.' prefix)
    model = TransformerWrapper()
    try:
        model.load_state_dict(torch.load(GLOBAL_MODEL_PATH, weights_only=True))
        print(f"Loaded global FL model from {GLOBAL_MODEL_PATH}")
    except Exception as e:
        print(f"Warning: Failed to load global model: {e}. Using base weights.")
elif os.path.exists(PRETRAINED_PATH):
    # pretrained_transformer.pth was saved as bare DistilBert state_dict (no 'model.' prefix)
    # TransformerWrapper.__init__ loads it into self.model automatically
    model = TransformerWrapper(pretrained_path=PRETRAINED_PATH)
    print(f"Loaded pretrained model from {PRETRAINED_PATH}")
else:
    model = TransformerWrapper()
    print("Warning: No pretrained or global model found. Using base DistilBERT weights.")

model.eval()

# Tokenization happens on the server side
tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")

def predict_sentiment(text: str) -> dict:
    """
    Server-side inference endpoint.
    Receives raw text, processes it through the Transformer,
    and returns a JSON-serializable dictionary with label and confidence.
    """
    
    # Dynamically reload weights if a new global model was produced by FL training
    if os.path.exists(GLOBAL_MODEL_PATH):
        try:
            model.load_state_dict(torch.load(GLOBAL_MODEL_PATH, weights_only=True))
            model.eval()
        except Exception as e:
            print(f"Warning: Failed to hot-reload global model: {e}")
            
    encoding = tokenizer(
        text,
        padding="max_length",
        truncation=True,
        max_length=64,
        return_tensors="pt"
    )
    
    with torch.no_grad():
        logits = model(encoding["input_ids"], encoding["attention_mask"])
        probs = torch.nn.functional.softmax(logits, dim=1)[0]
        
        pred_idx = torch.argmax(logits, dim=1).item()
        
        # 0 = negative, 1 = positive (IMDB dataset convention)
        pred_label = "Positive" if pred_idx == 1 else "Negative"
        confidence = float(probs[pred_idx] * 100)
        
    return {"label": pred_label, "confidence": min(confidence, 99.9)}

if __name__ == "__main__":
    print(predict_sentiment("I absolutely love this product."))
    print(predict_sentiment("This is a terrible item, do not buy."))
