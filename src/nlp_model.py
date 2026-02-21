import torch
import torch.nn as nn

from src.nlp_data import VOCAB_SIZE

class ReviewLSTM(nn.Module):
    def __init__(self, vocab_size=VOCAB_SIZE, embedding_dim=32, hidden_dim=64):
        super(ReviewLSTM, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 2)
        
    def forward(self, x):
        # x shape: (batch_size, seq_length)
        embedded = self.embedding(x)
        # embedded shape: (batch_size, seq_length, embedding_dim)
        
        lstm_out, (hn, cn) = self.lstm(embedded)
        # hn shape: (1, batch_size, hidden_dim)
        
        # Take the final hidden state
        final_hidden = hn[-1]
        
        out = self.fc(final_hidden)
        # out shape: (batch_size, 2)
        return out

if __name__ == "__main__":
    # Test with dummy data
    batch_size = 4
    seq_length = 50
    dummy_input = torch.randint(0, VOCAB_SIZE, (batch_size, seq_length))
    model = ReviewLSTM()
    output = model(dummy_input)
    assert output.shape == (batch_size, 2)
    print("Model forward pass successful. Output shape:", output.shape)
