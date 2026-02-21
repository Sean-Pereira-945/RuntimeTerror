---
phase: 3
plan: 2
wave: 2
---

# Plan 3.2: Adapt Client and Orchestrator for NLP

## Objective
Refactor the Flower client and server simulation to use the new `ReviewLSTM`, handle the new NLP datasets, and implement random asynchronous epochs. 

## Context
- src/nlp_client.py (to be created based on src/client.py)
- src/main.py
- .gsd/phases/3/RESEARCH.md

## Tasks

<task type="auto">
  <name>Create NLP Flower Client</name>
  <files>
    - src/nlp_client.py
  </files>
  <action>
    - Create `NLPClient(fl.client.NumPyClient)`.
    - In the `fit()` method, randomly choose the number of local epochs using `random.randint(2, 5)` to simulate asynchronous/variable compute.
    - Implement the PyTorch training loop to carefully handle the new sequence data and LSTM output.
  </action>
  <verify>Ensure `src/nlp_client.py` parses correctly.</verify>
  <done>Client handles LSTM training with randomized 2-5 local epochs.</done>
</task>

<task type="auto">
  <name>Update Simulation for NLP</name>
  <files>
    - src/main.py
  </files>
  <action>
    - Modify the server thread to use standard `fl.server.strategy.FedAvg` (or `AsyncFedAvgStrategy` if preferred for the buffer mechanic).
    - Map the 3 clients to the 3 unique datasets ("Phone", "Clothing", "Food") initialized via `src/nlp_data.py`.
    - Ensure the central simulation correctly aggregates the LSTM weights via Threading gRPC as built in Phase 2.
    - Save the final aggregated model to `global_model.pth`.
  </action>
  <verify>Run `python -m src.main`. The console should show clients training for different numbers of epochs and the simulation completing without shape mismatch errors.</verify>
  <done>Simulation successfully trains the global LSTM model across the 3 heterogeneous NLP clients.</done>
</task>

## Success Criteria
- [ ] Clients dynamically execute 2-5 epochs per round.
- [ ] The simulation successfully trains an LSTM on text data and saves `global_model.pth`.
