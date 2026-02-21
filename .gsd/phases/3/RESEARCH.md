---
phase: 3
level: 2
researched_at: 2026-02-21
---

# Phase 3 Research: LSTM, Streamlit, and NLP Federated Learning

## Goal
Pivot the existing image classification (MNIST) Federated Learning setup to an Amazon/Google-style product review analyzer using an LSTM for sentiment analysis, complete with a Streamlit UI showcasing real-time aggregation and inference.

## Key Requirements & Architecture
1. **Model:** `Embedding -> LSTM -> Linear (Binary Classification)`.
2. **Data:** Text reviews from 3 clients (Phone, Clothing, Food). Needs local tokenization/vocab.
3. **Federation:** 3 clients training asynchronously (random 2-5 epochs per round) using `flwr==1.0.0` FedAvg.
4. **UI:** Streamlit app with "START TRAINING", live plots, and interactive inference.

## Implementation Strategy

### 1. NLP Data Pipeline
Instead of downloading MNIST, we need a mechanism to generate or load mock review data for Phone, Clothing, and Food. 
*   **Approach:** We will create a `src/nlp_data.py` utility that generates synthetic but realistic positive/negative reviews for the 3 domains.
*   **Preprocessing:** We need a common vocabulary. In a real FL setup, building a global vocab is a challenge. For this prototype, we will assume a basic pre-shared vocabulary (or a simple hash-based tokenizer) out-of-the-box so the Embedding layer size is consistent across all clients. PyTorch's `torchtext` or simple standard library tokenization will be used.

### 2. LSTM Model
*   **Architecture:** `src/nlp_model.py` will contain `ReviewLSTM`.
    *   `nn.Embedding(vocab_size, embedding_dim)`
    *   `nn.LSTM(embedding_dim, hidden_dim, batch_first=True)`
    *   `nn.Linear(hidden_dim, 2)` (Positive/Negative output).
*   **Challenge:** LSTMs have internal states (`hn`, `cn`). For FL, we only average the *weights* of the LSTM and Linear layers, not the hidden states. Flower `NumPyClient` handles this easily.

### 3. Asynchrony and Flower
*   **Requirement:** Random 2-5 epochs per client.
*   **Approach:** In `FLClient.fit()`, we will use `random.randint(2, 5)` to determine the number of local epochs dynamically, ignoring the server's `config["epochs"]`.
*   **Aggregation:** We can revert the aggregation strategy back to standard `FedAvg` (or keep the `AsyncMedianStrategy` from Phase 2, but standard FedAvg is explicitly requested in the new prompt: "Flower FedAvg with async client epochs"). 

### 4. Streamlit Integration
*   Streamlit runs top-to-bottom on interaction. Running a Flower simulation *inside* a Streamlit button click can block the UI.
*   **Approach:** `app.py` (the Streamlit entrypoint).
    *   Use `st.button("START TRAINING")` to spawn a separate background thread or process that runs the Flower `start_simulation`.
    *   The simulation will write its accuracy metrics to a shared structure or a local JSON/CSV file.
    *   Streamlit will use `st_autorefresh` or a `while` loop with `st.empty().line_chart()` to read that file and plot live.
    *   Once training is done, the global model weights are saved to `global_model.pth`.
    *   The Judge Demo text box will load `global_model.pth`, tokenize the input, and run inference.

## Decisions Made
| Component | Decision | Rationale |
| :--- | :--- | :--- |
| **Data** | Synthetic Reviews | Ensures we have immediately available, domain-specific (Phone, Clothing, Food) heterogeneous data without complex downloads. |
| **Tokenizer** | Simple Char/Word level Dict | Keeps dependencies light (no `transformers`/`spacy` needed for a prototype), ensuring identical `vocab_size` for the shared `Embedding` layer. |
| **Client Epochs** | `random.randint(2, 5)` in `fit()` | Directly satisfies the "async client epochs" requirement. |
| **Streamlit State** | File-based or Session State | Safest way to pass data between the plotting UI thread and the FL simulation background thread. |

## Next Steps (Planning Phase 3)
We will create plans for:
1.  **Plan 3.1: NLP Model & Data Pipeline:** Creating the LSTM and the synthetic dataset generators.
2.  **Plan 3.2: Flower Client & Strategy Adaptation:** Updating the client to use the LSTM, the random epochs, and switching to FedAvg. 
3.  (Phase 4 will handle the Streamlit UI, as defined in our ROADMAP. Note: User specifically said "add/change these things in phase 3 too", so we will pull the Streamlit plan into Phase 3 execution as well to ensure it's all done together as requested). We will make Plan 3.3 for the Streamlit App.
