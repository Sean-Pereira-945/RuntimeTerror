---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Implement NLP Data Pipeline and LSTM Model

## Objective
Create the foundational NLP components: a synthetic review generator for heterogeneous clients (Phone, Clothing, Food) and an LSTM PyTorch model for sentiment classification.

## Context
- src/nlp_data.py (to be created)
- src/nlp_model.py (to be created)
- .gsd/phases/3/RESEARCH.md

## Tasks

<task type="auto">
  <name>Create Synthetic NLP Data Generator</name>
  <files>
    - src/nlp_data.py
  </files>
  <action>
    - Write a script that generates a mock dataset of reviews (e.g., 500 positive and 500 negative reviews per store category: Phone, Clothing, Food).
    - Implement a basic character or word-level tokenizer with a fixed vocabulary size (e.g., `VOCAB_SIZE=1000`).
    - Create a PyTorch `Dataset` class that yields `(tensor_sequence, label)` pairs.
    - Expose a `get_store_dataset(store_name)` function.
  </action>
  <verify>Run `python src/nlp_data.py`. It should print a sample tokenized review and its label without errors.</verify>
  <done>Synthetic NLP data pipeline yields batched PyTorch tensors for 3 distinct stores.</done>
</task>

<task type="auto">
  <name>Implement LSTM Model</name>
  <files>
    - src/nlp_model.py
  </files>
  <action>
    - Create `ReviewLSTM` inheriting from `torch.nn.Module`.
    - Architecture: `nn.Embedding(VOCAB_SIZE, embedding_dim) -> nn.LSTM(embedding_dim, hidden_dim, batch_first=True) -> nn.Linear(hidden_dim, 2)`.
    - Handle the sequence packing or simply use the final hidden state `hn` for classification.
  </action>
  <verify>Write a quick block in `if __name__ == "__main__":` that passes a dummy tensor shape `(batch_size, sequence_length)` through the `ReviewLSTM` and asserts the output shape is `(batch_size, 2)`.</verify>
  <done>LSTM model accepts tokenized sequences and outputs binary classification logits.</done>
</task>

## Success Criteria
- [ ] `src/nlp_data.py` generates Phone, Clothing, and Food text tensors.
- [ ] `src/nlp_model.py` correctly processes those tensors using an Embedding+LSTM architecture.
