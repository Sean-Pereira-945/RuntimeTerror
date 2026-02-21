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

### Phase 3: Robust Aggregation Strategy
**Status**: ⬜ Not Started
**Objective**: Implement the robust aggregation algorithm (e.g., Trimmed Mean, Median) within a custom Flower `Strategy` and introduce mitigation of malicious/noisy clients.

### Phase 4: Evaluation and Demonstration
**Status**: ⬜ Not Started
**Objective**: Run the full training loop, capture convergence metrics, generate evaluation graphs, and finalize reproducible prototype.
