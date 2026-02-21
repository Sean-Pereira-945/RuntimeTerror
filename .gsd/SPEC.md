# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Build a privacy-preserving federated learning system that acts as an Amazon/Google-style product review analyzer. The system must support asynchronous updates across 3 heterogeneous client stores (e.g., Phone, Clothing, Food) to train a single global LSTM model for binary sentiment classification (Positive/Negative). It will be showcased via an interactive Streamlit web app.

## Goals
1. Support for asynchronous client epochs (random 2-5 epochs per client) using Flower FedAvg.
2. Implement a Transformer model (HuggingFace) for NLP sentiment analysis. If too complex/slow for the local hardware simulation, fallback to the existing LSTM.
3. Pretrain the global model on a large-scale text sentiment dataset (at least 20,000 samples) before federated fine-tuning.
4. Simulate 3 distinct client stores with heterogeneous review data (no raw data shared) for the federated phase.
5. Build a Streamlit web app showing a live accuracy plot and live predictions.
6. Provide a user interface where inference strictly occurs to help the client understand the results (model is server-side, but prediction interpretations are returned to the client).
7. Working prototype with reproducible results.
8. Implement security sanitization against malicious data using Krum and Cosine Similarity aggregation.
9. Implement fault tolerance with heartbeat monitoring and DDoS resistance via rate limiting.
10. Support dynamic schema selection with varying column mappings across clients.
11. Advanced visualizations including accuracy heatmaps and self-model improvement metrics.
12. Ensure strict tech stack compliance: Python (Backend) and React/Tailwind/TS (Frontend).

## Non-Goals (Out of Scope)
- Deployment in a real-world production environment (focusing on prototype/simulation)
- Advanced homomorphic encryption (unless necessary for basic privacy preservation)
- Complex multi-class sentiment (sticking to binary Positive/Negative)

## Users
Judges and reviewers evaluating the Federated Learning NLP capabilities.

## Constraints
- Must run in an asynchronous fashion, simulating network/compute delays
- Data must remain local to 3 specific mock clients
- **Must use Flower (`flwr==1.0.0`) framework** for the overarching federated learning orchestration.
- **Must use a Transformer (or fallback LSTM)** model architecture.
- **Inference logic** must ensure the model lives on the server, but prediction results are strictly returned to the client interface.

## Success Criteria
- [ ] 3 clients successfully train locally on text data and send updates asynchronously.
- [ ] Global LSTM model aggregates learned sentiment effectively.
- [ ] Streamlit interface allows live text input and correctly predicts sentiment with a confidence score.
- [ ] Prototype successfully handles the demo review: "hate this phone" → ❌ Negative.
