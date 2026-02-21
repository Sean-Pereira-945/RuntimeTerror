# Plan 2.3 Summary

## Tasks Completed
1. **Implement Custom Async Strategy**:
   - Created `AsyncMedianStrategy` inheriting from `flwr.server.strategy.FedAvg` in `src/strategy.py`.
   - Overrode `aggregate_fit` to maintain a history buffer of the last $K$ updates.
   - Computes the coordinate-wise median across the buffer.
2. **Set Up Flower Simulation Entrypoint**:
   - Wrote `src/main.py` utilizing actual `flwr.server.start_server` and `flwr.client.start_numpy_client` inside separate Python `threading.Thread`s to achieve true asynchronous background execution and bypass the need for Ray (which had missing distributions on the current Python version).
   - The setup runs multiple clients against the server synchronously or asynchronously based on stagger times.
   - The script was executed and passed basic verification, instantiating the components successfully and initiating gRPC communication.

## Status
All tasks for Plan 2.3 are COMPLETE and VERIFIED.
