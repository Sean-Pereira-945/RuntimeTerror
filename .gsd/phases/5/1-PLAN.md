---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: 20k Pretraining Pipeline

## Objective
Download a 20,000+ sample text sentiment dataset (IMDB) and pretrain the global HuggingFace Transformer model to establish a strong baseline before federated fine-tuning.

## Context
- `src/pretrain.py` (to be created)
- `requirements.txt`
- `.gsd/phases/5/RESEARCH.md`

## Tasks

<task type="auto">
  <name>Install Transformer Dependencies</name>
  <files>
    - requirements.txt
  </files>
  <action>
    - Add `transformers` and `datasets` to `requirements.txt`.
    - Install them via pip.
  </action>
  <verify>Run `pip install -r requirements.txt`.</verify>
  <done>Transformers and datasets packages are installed.</done>
</task>

<task type="auto">
  <name>Create Pretraining Script</name>
  <files>
    - `src/pretrain.py`
  </files>
  <action>
    - Load the `imdb` dataset from the `datasets` library.
    - Shuffle and select exactly 20,000 samples for the `train` split.
    - Initialize a `DistilBertTokenizer` and `DistilBertForSequenceClassification` (num_labels=2) using the `distilbert-base-uncased` checkpoint.
    - Tokenize the dataset (padding="max_length", truncation=True, max_length=64 for speed).
    - Use HuggingFace `Trainer` or PyTorch standard loop to train for 1-2 epochs (or just run a single epoch to prove functionality in the demo environment).
    - Save the resulting model state dictionary to `pretrained_transformer.pth`.
  </action>
  <verify>Run `python src/pretrain.py`. The script should download the dataset, train (even if briefly), and output `pretrained_transformer.pth`.</verify>
  <done>A serialized pretrained transformer `pretrained_transformer.pth` exists locally.</done>
</task>

## Success Criteria
- [ ] Dependencies are installed.
- [ ] `src/pretrain.py` executes successfully.
- [ ] `pretrained_transformer.pth` is generated.
