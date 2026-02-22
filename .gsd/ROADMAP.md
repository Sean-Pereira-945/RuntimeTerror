# ROADMAP.md



> **Current Phase**: Phase 12 (complete)

> **Milestone**: v2.0



## Must-Haves (from SPEC)

- [ ] Asynchronous client updates

- [ ] Robust aggregation algorithm

- [ ] Malicious/noisy client mitigation

- [ ] Privacy preservation demonstration

- [ ] Performance evaluation with heterogeneous datasets

- [ ] Working prototype

- [ ] Krum/Cosine Aggregation

- [ ] Heartbeat & Rate Limiting

- [ ] Dynamic Column Solving

- [ ] Accuracy Heatmap

- [ ] Shapley-based Client Reward/Weighting for Low-Compute



## Phases



### Phase 1: Foundation and Simulation Setup

**Status**: âœ… Complete



### Phase 2: Pivot to Flower and Asynchronous Setup

**Status**: âœ… Complete



### Phase 3: LSTM NLP Model and Heterogeneous Data

**Status**: âœ… Complete



### Phase 4: Streamlit Web App and Demo Integration

**Status**: âœ… Complete



### Phase 5: Large-Scale Pretraining & Transformer Upgrade

**Status**: âœ… Complete



### Phase 6: FL Server Stability & Port Binding Fix

**Status**: âœ… Complete



### Phase 7: React Frontend & API Integration

**Status**: âœ… Complete



### Phase 8: Project Restructuring & Architecture Cleanup

**Status**: âœ… Complete



### Phase 9: Live FL Metrics & Client Data Integration

**Status**: âœ… Complete



### Phase 10: Full Dynamic Data Integration & Frontend Cleanup

**Status**: âœ… Complete



### Phase 11: Security, Advanced Analytics & Dynamic Schema (SADS)

**Status**: âœ… Complete



### Phase 12: Codebase Optimization & Shapley-based Contribution

**Status**: âœ… Complete

**Objective**: Clean up legacy files and optimize project structure. Implement a mechanism to support compute-constrained clients by assessing data value via Shapley weights to adjust participation burdens.

**Objective**: Harden the system against malicious updates (Krum/Cosine), implement infrastructure resilience (Fault Tolerance/Rate Limiting), enable flexible data structures (Dynamic Schema), and deliver advanced performance telemetry (Accuracy Heatmaps/Self-Improvement tracking).

### Phase 13: Client CSV Upload and Authentication Fix
**Status**: ✅ Complete
**Objective**: Fix login authentication failures, enable client-side CSV upload, make uploaded datasets selectable, and restrict local training until a CSV is selected.

### Phase 14: Client-Triggered Local Training & Admin Panel
**Status**: ✅ Complete
**Objective**: Modify training to be client-specific and async, and restore the Admin Panel UI.

### Phase 15: Clean-up, Finalization & Model Verification
**Status**: ✅ Complete
**Objective**: Clean up leftover debug code, finalize the user experience, and functionally verify that client-uploaded CSVs are correctly parsed for local training and weights are successfully aggregated.
