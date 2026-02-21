# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Build a privacy-preserving federated learning system that enables multiple clients to collaboratively train a model without sharing raw data. The system must support asynchronous updates, handle unreliable or malicious clients, and improve convergence on heterogeneous datasets.

## Goals
1. Support for asynchronous client updates
2. Implementation of at least one robust aggregation algorithm (e.g., trimmed mean, median, or custom approach)
3. Mechanism to detect or mitigate malicious or noisy clients
4. Clear demonstration of privacy preservation
5. Performance evaluation showing training stability or convergence improvement
6. Working prototype with reproducible results

## Non-Goals (Out of Scope)
- Deployment in a real-world production environment (focusing on prototype/simulation)
- Advanced homomorphic encryption (unless necessary for basic privacy preservation)

## Users
Developers and researchers interested in secure and scalable federated learning.

## Constraints
- Must run in an asynchronous fashion, simulating network/compute delays
- Data must remain local to clients

## Success Criteria
- [ ] Asynchronous updates are successfully merged into the global model
- [ ] Robust aggregation handles Byzantine or noisy clients
- [ ] Training convergence is demonstrated on heterogeneous dataset
- [ ] Prototype is reproducible
