---
phase: 5
plan: 2
wave: 2
---

# Plan 5.2: Transformer Federated Upgrade

## Objective
Upgrade the Flower orchestrator and client scripts to utilize the HuggingFace `DistilBert` model and its specialized tokenization outputs (`input_ids`, `attention_mask`) instead of the previous LSTM sequence data.

## Context
- `src/transformer_model.py` (to be created)
- `src/nlp_client.py`
- `src/main.py`
- `.gsd/phases/5/RESEARCH.md`

## Tasks

<task type="auto">
  <name>Create Transformer Wrapper</name>
  <files>
    - `src/transformer_model.py`
  </files>
  <action>
    - Create a simple PyTorch `nn.Module` wrapper around `DistilBertForSequenceClassification`.
    - Provide a `forward` method that accepts `input_ids` and `attention_mask` and returns logits.
  </action>
  <verify>Run a dry test block in the file asserting the output shape is `(batch_size, 2)`.</verify>
  <done>Transformer model logic is encapsulated and ready for FL integration.</done>
</task>

<task type="auto">
  <name>Upgrade Federated Architecture</name>
  <files>
    - `src/nlp_client.py`
    - `src/main.py`
    - `src/nlp_data.py`
  </files>
  <action>
    - Update `src/nlp_data.py` to use `DistilBertTokenizer` rather than the old custom hashing function, ensuring `ReviewDataset` returns both `input_ids` and `attention_mask`.
    - Update `NLPClient` in `src/nlp_client.py` to handle passing two inputs (ids and masks) into the model. Ensure the `epochs = random.randint(2, 5)` async logic remains.
    - Update `src/main.py` to load `pretrained_transformer.pth` into the model *before* starting the Server and Client threads. This proves the system is fine-tuning the pretrained 20k model, not starting from scratch.
  </action>
  <verify>Run `python -m src.main`. Ensure the FL process runs without tensor shape errors and fine-tunes the transformer.</verify>
  <done>FL orchestrator successfully distributes and aggregates fine-tuning updates for the transformer.</done>
</task>

## Success Criteria
- [ ] Clients successfully process text using the `DistilBertTokenizer`.
- [ ] The simulation fine-tunes `pretrained_transformer.pth` over the 3 simulated domain-specific stores.
