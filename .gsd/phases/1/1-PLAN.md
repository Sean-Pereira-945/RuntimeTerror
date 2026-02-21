---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Setup Basic FL Data and Models

## Objective
Establish the project structure, dependencies, model definition, and non-IID data partitioning to prepare for the asynchronous simulation.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- .gsd/phases/1/RESEARCH.md

## Tasks

<task type="auto">
  <name>Initialize Project and Dependencies</name>
  <files>
    - requirements.txt
    - .gitignore
  </files>
  <action>
    - Create `requirements.txt` containing: `torch`, `torchvision`, `numpy`, `tqdm`.
    - Create a standard Python `.gitignore`.
  </action>
  <verify>Run `pip install -r requirements.txt` (or dry run) to verify they are installable.</verify>
  <done>Project base files exist.</done>
</task>

<task type="auto">
  <name>Model and Data Utilities</name>
  <files>
    - src/model.py
    - src/data.py
  </files>
  <action>
    - In `src/model.py`: Define a simple PyTorch CNN for MNIST or CIFAR-10.
    - In `src/data.py`: Write `get_dataset()` to download MNIST/CIFAR.
    - In `src/data.py`: Write `partition_data(dataset, num_clients, alpha)` that uses NumPy's Dirichlet distribution to create non-IID partitions of indices for each client. Return a mapping of client IDs to index lists.
  </action>
  <verify>Write a temporary test script that instantiates the model and partitions the dataset, printing the class distribution for 2 clients.</verify>
  <done>We have a working model architecture and a dataset successfully partitioned in a non-IID manner.</done>
</task>

## Success Criteria
- [ ] Requirements are defined.
- [ ] A CNN model is implemented in PyTorch.
- [ ] Dataset can be downloaded and partitioned into heterogeneous client shards.
