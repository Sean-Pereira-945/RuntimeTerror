import torch
import torch.nn as nn
from transformers import DistilBertForSequenceClassification

class TransformerWrapper(nn.Module):
    def __init__(self, pretrained_path=None):
        super(TransformerWrapper, self).__init__()
        # Load the DistilBert base model
        self.model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)
        
        # Load pretrained weights from Phase 5 (if they exist)
        if pretrained_path:
            try:
                self.model.load_state_dict(torch.load(pretrained_path))
            except Exception as e:
                print(f"Failed to load pretrained weights from {pretrained_path}: {e}")
                
    def forward(self, input_ids, attention_mask):
        # We extract logits directly to maintain compatibility with the old simple CrossEntropy setup
        # or we rely on HuggingFace's internal loss calculation.
        # For simplicity in integration with the PyTorch client loop, we will just return logits.
        output = self.model(input_ids=input_ids, attention_mask=attention_mask)
        return output.logits

if __name__ == "__main__":
    # Test block
    wrapper = TransformerWrapper()
    wrapper.eval()
    
    # Dummy tensors (batch=2, seq_len=10)
    dummy_input = torch.randint(0, 30000, (2, 10))
    dummy_mask = torch.ones((2, 10), dtype=torch.long)
    
    with torch.no_grad():
        logits = wrapper(dummy_input, dummy_mask)
        assert logits.shape == (2, 2)
        print("Transformer wrapper instantiated and forward pass verified:", logits.shape)
