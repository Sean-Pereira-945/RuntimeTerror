---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Client and Server Scaffold

## Objective
Create the initial client and server classes to simulate the federated learning setup, minus the asynchronous queue logic which comes in Phase 2.

## Context
- .gsd/SPEC.md
- .gsd/phases/1/RESEARCH.md

## Tasks

<task type="auto">
  <name>Implement FL Client Scaffold</name>
  <files>
    - src/client.py
  </files>
  <action>
    - Create a `FLClient` class that takes a client ID, its data partition (DataLoader), and the global model.
    - Implement a `train(self, model_state_dict)` method that initializes a local copy of the model with the given state dict, runs stochastic gradient descent for $E$ epochs, and returns the updated local model weights (or the delta/gradients).
  </action>
  <verify>Test a single client training for 1 epoch and verify the weights change.</verify>
  <done>Client can locally train a model given a subset of data.</done>
</task>

<task type="auto">
  <name>Implement Central Server Scaffold</name>
  <files>
    - src/server.py
  </files>
  <action>
    - Create a `FLServer` class holding the global model and a mechanism to store aggregated weights.
    - Implement a basic `evaluate(self, test_loader)` method to compute loss and accuracy of the global model.
  </action>
  <verify>Instantiate the server and evaluate the untrained model on test data.</verify>
  <done>Server can hold the model and evaluate it on a test set.</done>
</task>

## Success Criteria
- [ ] FLClient can perform local training.
- [ ] FLServer can evaluate its global model.
