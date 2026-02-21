---
phase: 5
level: 2
researched_at: 2026-02-21
---

# Phase 5 Research: Transformer Pretraining & Client-Side Inference

## Goal
Upgrade the current LSTM federated sentiment analyzer to a HuggingFace Transformer model, pretrain it on at least 20,000 text sentiment samples, and ensure the inference architecture strictly guarantees the model stays on the server while the client only receives the final prediction interpretations.

## Key Requirements & Architecture
1. **Model:** HuggingFace `DistilBertForSequenceClassification` (or similar lightweight transformer).
2. **Pretraining Dataset:** A dataset of at least 20,000 samples. `IMDB` or `SST2` from the `datasets` library are excellent 20k+ datasets for binary sentiment.
3. **Inference Flow:** The Streamlit app (client interface) must *not* load the model directly. It should send the raw text to a server function/API, which runs the model and returns the result to the client UI.

## Implementation Strategy

### 1. Large-Scale Pretraining (20,000+ samples)
*   **Dataset:** We will use the `datasets` library to load `imdb` (50,000 reviews). We will take a subset of 20,000 for the pretraining phase to satisfy the "at least 20,000" requirement while keeping local prep time reasonable.
*   **Pipeline:** We will create `src/pretrain.py`.
    *   Load `distilbert-base-uncased`.
    *   Tokenize the 20,000 samples using `DistilBertTokenizer`.
    *   Train the model using standard PyTorch (or HuggingFace `Trainer`).
    *   Save the pretrained weights to `pretrained_transformer.pth` (or HuggingFace format).

### 2. Federated Fine-Tuning (Transformer Upgrade)
*   **Model Wrapper:** We will create `src/transformer_model.py` which wraps the HuggingFace model so it exposes `state_dict` similarly to our LSTM, allowing the existing `NumPyClient` Flower setup to extract and inject weights.
*   **Client Adjustment:** `src/nlp_client.py` will be updated (or a new `TransformerClient` created) to handle HuggingFace tokenized inputs (which include `input_ids` and `attention_mask`) instead of the simple 1D `tokens` array from the LSTM.
*   **Performance Fallback:** Transformers are heavy. If local simulation CPU goes OOM or takes >10 minutes per round, the scripts will heavily truncate sequence length (e.g., `MAX_LEN=32`) or fall back to the LSTM. For the prompt's sake, we will attempt the Transformer integration.

### 3. Server-Side Inference Architecture
*   Currently, `app.py` loads `global_model.pth` directly into memory. This violates the new requirement: *"the model is server side while the data and all is client side and predictions are returend to the client"*.
*   **Approach:** We will split `app.py` logic.
    *   **Server Component (Mock API):** We will create a `src/inference_server.py` containing a function `predict_sentiment(text)` that loads the model and runs the inference. In a real app, this would be a Flask/FastAPI endpoint. For this Streamlit demo, it will simply be an isolated Python module that Streamlit imports, representing the isolated "Server" boundary. Streamlit will pass the string `text` to this module and receive only the `(label, confidence)` tuple back.

## Decisions Made
| Component | Decision | Rationale |
| :--- | :--- | :--- |
| **Transformer Model** | `DistilBert` | Smallest viable BERT model. Essential for running Federated Learning locally on a single machine without GPU OOM. |
| **Pretraining Data** | `IMDB` via `datasets` | Industry standard dataset with >20k samples natively. |
| **Inference Boundary** | Decoupled `inference_server.py` | Cleanly separates the Streamlit UI (Client) from the PyTorch model evaluation (Server), satisfying the architectural requirement without needing to spin up a full HTTP server locally. |

## Next Steps (Planning Phase 5)
1.  **Plan 5.1: Transformer Pretraining Pipeline:** Write the script to download 20k IMDB samples and pretrain `DistilBert`.
2.  **Plan 5.2: Transformer Federated Upgrade:** Refactor `src/main.py` and the Client to use the pretrained `DistilBert` weights for the heterogeneous FL simulation.
3.  **Plan 5.3: Server-Side Inference Architecture:** Update Streamlit to route texts through an isolated server-side inference module.
