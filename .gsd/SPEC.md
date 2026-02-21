# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Build a privacy-preserving federated learning system that acts as an Amazon/Google-style product review analyzer. The system must support asynchronous updates across 3 heterogeneous client stores (e.g., Phone, Clothing, Food) to train a single global LSTM model for binary sentiment classification (Positive/Negative). It will be showcased via an interactive Streamlit web app.

## Goals
1. Support for asynchronous client epochs (random 2-5 epochs per client) using Flower FedAvg.
2. Implement an LSTM model (Embedding → LSTM → Binary classification) for NLP sentiment analysis.
3. Simulate 3 distinct client stores with heterogeneous review data (no raw data shared).
4. Build a Streamlit web app showing a live accuracy plot and live predictions.
5. Provide a simple user interface: Judge types a review (e.g., "hate this phone") → Instant prediction (e.g., ❌ Negative 92%).
6. Working prototype with reproducible results.

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
- **Must use an LSTM** model architecture.

## Success Criteria
- [ ] 3 clients successfully train locally on text data and send updates asynchronously.
- [ ] Global LSTM model aggregates learned sentiment effectively.
- [ ] Streamlit interface allows live text input and correctly predicts sentiment with a confidence score.
- [ ] Prototype successfully handles the demo review: "hate this phone" → ❌ Negative.
