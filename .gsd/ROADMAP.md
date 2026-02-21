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

### Phase 5: Large-Scale Pretraining & Transformer Upgrade
**Status**: ✅ Complete
**Objective**: Upgrade the text pipeline to download and pretrain on a 20,000+ sample text sentiment dataset. Upgrade the model to a HuggingFace Transformer (with LSTM fallback). Ensure the Streamlit UI inference logic correctly routes client data to the server model and returns the prediction result back to the user/client.

### Phase 6: FL Server Stability & Port Binding Fix
**Status**: ✅ Complete
**Objective**: Fix the `Failed to bind to address 127.0.0.1:8080` error occurring when the Streamlit app restarts or triggers the federated learning simulation multiple times. Ensure the background threads and gRPC server are gracefully terminated and the port is freed before attempting to restart the simulation.

### Phase 7: React Frontend & API Integration
**Status**: ✅ Complete
**Objective**: Integrate the newly provided Vite/React frontend dashboard into the project. Replace the hardcoded `mockData` animations in the React app with live `fetch()` API calls. Develop a lightweight Python backend wrapper (e.g. FastAPI or Flask) to start the Asynchronous FL simulation, fetch training progress, and serve prediction endpoints to the frontend UI.

### Phase 8: Project Restructuring & Architecture Cleanup
**Status**: ✅ Complete
**Objective**: Clean up the monorepo file structure separating React logic to `frontend/` and Python logic entirely to `backend/`. Remove identically duplicated source files, migrate Streamlit UI `app.py` to `backend/`, and correct all relative Python imports to stabilize execution modules across the stack.

### Phase 9: Live FL Metrics & Client Data Integration
**Status**: ✅ Complete
**Objective**: Change the dashboard graphs to reflect actual model training results rather than mock data. Enable clients to upload real data (CSV), which is then used by their local client node during the FL simulation. The server orchestrates FedAvg to update the pretrained global model using these actual client weights, while bridging real-time telemetry (accuracy, loss) back to the React dashboards.

### Phase 10: Full Dynamic Data Integration & Frontend Cleanup
**Status**: ✅ Complete
**Objective**: Remove all remaining static mocks from the inference engine and frontend dashboards. Ensure the global model weights are genuinely saved to `global_model.pth` after Federated Learning simulation completes. Bind the `ClientDashboard.tsx` to dynamically query endpoint metrics specific to the logged-in store. Strip static 'Clients' and 'Models' navigation items from the Admin Sidebar.

### Phase 11: Advanced Edge Compute, Resilience & Analytics Pivot
**Status**: ⏳ Pending
**Objective**: 
1. **Low Compute**: Integrate Local Updating (FedProx), Quantization/Sparsification, and Client Selection to optimize for resource-constrained clients. Provide Secure Data Proxy / Split Learning for "No Device" scenarios.
2. **Resilience & Security**: Add DDoS resistance, fault tolerance (ignore dropping stragglers), and filter malicious data to protect global updates. Support structural heterogeneity ("different amount of column solvings").
3. **Analytics**: Implement an Accuracy Heatmap. Track and display "improvement on self model". Ensure absolute purity in frontend API bindings (zero static JS mocks).

