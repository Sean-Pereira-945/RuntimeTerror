# ROADMAP.md

> **Current Phase**: Phase 1
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [ ] Asynchronous client updates
- [ ] Robust aggregation algorithm
- [ ] Malicious/noisy client mitigation
- [ ] Privacy preservation demonstration
- [ ] Performance evaluation with heterogeneous datasets
- [ ] Working prototype

## Phases

### Phase 1: Foundation and Simulation Setup
**Status**: ✅ Complete
**Objective**: Establish the basic federated learning simulation environment with a central server, multiple clients, and heterogeneous data partitioning.

### Phase 2: Pivot to Flower and Asynchronous Setup
**Status**: ✅ Complete
**Objective**: Integrate Flower (`flwr==1.0.0`). Adapt the PyTorch client into a `flwr.client.NumPyClient`. Implement an asynchronous strategy or custom server loop to process updates independently.

### Phase 3: LSTM NLP Model and Heterogeneous Data
**Status**: ✅ Complete
**Objective**: Develop the text preprocessing pipeline. Implement the `Embedding -> LSTM -> Binary Classification` model in PyTorch. Create the heterogeneous dataset configurations for the 3 distinct stores (Phone, Clothing, Food).

### Phase 4: Streamlit Web App and Demo Integration
**Status**: ✅ Complete
**Objective**: Build the interactive Streamlit interface. Integrate the federated training loop to display live accuracy plots. Implement the live prediction inference for the Judge Demo ("hate this phone").
