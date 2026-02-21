---
phase: 1
level: 2
researched_at: 2026-02-21
---

# Phase 1 Research

## Questions Investigated
1. Should we use an existing FL framework (e.g., Flower, PySyft) or build a custom PyTorch simulation loop?
2. How to simulate asynchronous updates?
3. What robust aggregation algorithms support asynchronous updates?
4. How to partition data to simulate heterogeneity (non-IID)?

## Findings

### Framework vs Custom Simulation
While frameworks like Flower provide great abstractions for synchronous federated learning, simulating true asynchronous updates and having fine-grained control over malicious clients and robust aggregation can be more straightforward with a custom PyTorch simulation using `asyncio` or multiple processes.
**Recommendation:** Build a custom PyTorch asynchronous simulation using concurrent threads/processes or a queue-based system where clients push updates to a central server independently.

### Simulating Asynchronous Updates
A robust way to simulate async updates is a server maintaining a `queue.Queue` of incoming model updates. Clients sleep for a random duration (to simulate communication/compute delays) and then push their local model weights (or gradients) to the server queue. The server processes these updates one by one or in mini-batches as they arrive, adjusting the global model and updating the global clock/version.

### Robust Aggregation for Asynchronous FL
Common robust aggregation methods:
- **Trimmed Mean:** Discard the top/bottom X% of updates per parameter and average the rest.
- **Median:** Take the coordinate-wise median of updates.
- **Krum:** Select the update that is closest to its neighbors.
*For asynchronous FL*, where updates arrive individually, we can maintain a buffer of the last `K` updates. When a new update arrives, we can apply robust aggregation (like Median or Trimmed Mean) over the buffer to compute the global model update. Since we only evaluate one update against a buffer, we might also use a distance-based threshold (e.g., if a new update is too far from the current global model, reject it).

### Data Partitioning (Heterogeneity/Non-IID)
Dirichlet distribution is standard for creating non-IID partitions of datasets like MNIST or CIFAR-10. Each client gets a subset of data skewed towards specific classes.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Custom PyTorch + Queue | Maximum control over async simulation, aggregation, and malicious clients. |
| Aggregation | Buffer-based coordinate-wise Median | Simple and robust against extreme outliers (malicious updates). |
| Dataset | MNIST or CIFAR-10 (Dirichlet partition) | Standard benchmarking dataset, easy to demonstrate convergence issues and improvements. |

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| torch | latest | Deep Learning framework |
| torchvision | latest | Datasets (MNIST/CIFAR) |
| numpy | latest | Array operations for Dirichlet distribution |

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
