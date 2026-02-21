import torch
from transformers import DistilBertTokenizer
from src.transformer_model import TransformerWrapper
import os

# "Server-Side" API boundary
# The Streamlit client should only call `predict_sentiment` and should never load weights explicitly.

# We load the weights once when the server boots
model = TransformerWrapper()
MODEL_PATH = "pretrained_transformer.pth"

# Fallback to the saved simulation global model if present, otherwise use base pretrain
if os.path.exists("global_model.pth"):
    try:
        model.load_state_dict(torch.load("global_model.pth"))
    except:
        pass
elif os.path.exists(MODEL_PATH):
    try:
        model.load_state_dict(torch.load(MODEL_PATH))
    except:
        pass

model.eval()

# The tokenization happens severely on the server side
tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")

def predict_sentiment(text: str) -> dict:
    """
    Simulates an API endpoint.
    Recieves raw text from the Client UI, processes it through the Server's Transformer, 
    and returns a simple JSON-serializable dictionary.
    """
    
    # Dynamically reload weights seamlessly so inference responds accurately to freshly run simulations
    if os.path.exists("global_model.pth"):
        try:
            model.load_state_dict(torch.load("global_model.pth", weights_only=True))
        except:
            pass
            
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
        
        # We assume 0 is negative, 1 is positive based on IMDB datasets defaults
        pred_label = "Positive" if pred_idx == 1 else "Negative"
        confidence = float(probs[pred_idx] * 100)
        
    return {"label": pred_label, "confidence": min(confidence, 99.9)}

if __name__ == "__main__":
    print(predict_sentiment("I absolutely love this product."))
    print(predict_sentiment("This is a terrible item, do not buy."))
