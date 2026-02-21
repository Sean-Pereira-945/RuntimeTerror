# Project Status Update

**Date:** 2026-02-21
**Current Phase:** Pivoting to Phase 2

## What we have done so far (Phase 1)
- Initialized the GSD project structure (`SPEC.md`, `ROADMAP.md`, `STATE.md`, `TODO.md`).
- Set up the base deep learning requirements (`torch`, `torchvision`, `numpy`).
- Implemented a standard `SimpleCNN` model for MNIST.
- Created robust data partitioning logic using a Dirichlet distribution to simulate non-IID (heterogeneous) data across clients.
- Scaffolds for a custom PyTorch Client and Server were created and verified (`src/client.py`, `src/server.py`).

## What we are doing now (Pivot to Flower)
Per your request, we are pivoting the architecture to use the **Flower (flwr)** framework, specifically version `1.0.0`, for the execution of further plans.

### Immediate Next Steps:
1. **Research Flower (1.0.0)** to understand how to implement asynchronous updates and robust aggregation (e.g., Trimmed Mean, Median) using custom Flower strategies.
2. **Refactor Codebase**: We will adapt our PyTorch client (`FLClient`) into a `flwr.client.NumPyClient`.
3. **Update Plans**: We will rewrite the execution plans for Phase 2 and 3 to utilize Flower's server and strategy configurations instead of the custom queue-based simulate approach we originally planned.

Using Flower will provide a more standardized, robust, and scalable federated learning foundation!
