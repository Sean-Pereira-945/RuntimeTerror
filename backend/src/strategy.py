import os
import json
from datetime import datetime
import flwr as fl
import numpy as np
from typing import List, Tuple, Optional, Dict, Union
import torch
from src.transformer_model import TransformerWrapper
from flwr.common import FitRes, Parameters, Scalar, ndarrays_to_parameters, parameters_to_ndarrays
from flwr.server.client_proxy import ClientProxy

class SaveMetricsStrategy(fl.server.strategy.FedAvg):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.metrics_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "fl_metrics.json")
        os.makedirs(os.path.dirname(self.metrics_file), exist_ok=True)
        # Initialize or clear
        with open(self.metrics_file, "w") as f:
            json.dump([], f)

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        
        aggregated_parameters, aggregated_metrics = super().aggregate_fit(server_round, results, failures)
        
        if aggregated_parameters is not None:
            # Convert Flower Parameters back to NumPy arrays
            ndarrays = parameters_to_ndarrays(aggregated_parameters)
            
            # Load the base model structure to inject weights
            model = TransformerWrapper()
            
            # Get the current state_dict, which gives us the keys and shapes of PyTorch tensors
            state_dict = model.state_dict()
            
            # Map NumPy arrays back to PyTorch Tensors based on the state_dict ordered architecture
            # NOTE: We assume the client side `get_parameters` yielded them in exactly deterministic order
            keys = list(state_dict.keys())
            for key, array in zip(keys, ndarrays):
                state_dict[key] = torch.tensor(array)
            
            # Update the base model structure with the federated weights
            model.load_state_dict(state_dict, strict=True)
            
            # Persist dynamically so inference endpoints pick it up natively
            torch.save(model.state_dict(), "global_model.pth")
            
        return aggregated_parameters, aggregated_metrics


    def aggregate_evaluate(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, fl.common.EvaluateRes]],
        failures: List[Union[Tuple[ClientProxy, fl.common.EvaluateRes], BaseException]],
    ) -> Tuple[Optional[float], Dict[str, fl.common.Scalar]]:
        
        aggregated_loss, aggregated_metrics = super().aggregate_evaluate(server_round, results, failures)
        
        if aggregated_loss is not None:
            # Gather client accuracies
            client_metrics = []
            for client, res in results:
                client_metrics.append({
                    "client_id": client.cid,
                    "accuracy": res.metrics.get("accuracy", 0.0) if res.metrics else 0.0,
                    "loss": float(res.loss)
                })
            
            # Compute global average accuracy since FedAvg default doesn't implicitly return it
            if client_metrics:
                global_accuracy = sum(c["accuracy"] for c in client_metrics) / len(client_metrics)
            else:
                global_accuracy = 0.0

            round_data = {
                "round": server_round,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "globalAccuracy": float(global_accuracy),
                "loss": float(aggregated_loss),
                "participants": len(results),
                "duration": "0.0s",
                "status": "completed",
                "client_metrics": client_metrics
            }

            try:
                with open(self.metrics_file, "r") as f:
                    data = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                data = []
            
            data.append(round_data)

            with open(self.metrics_file, "w") as f:
                json.dump(data, f, indent=2)

        return aggregated_loss, aggregated_metrics

class AsyncMedianStrategy(fl.server.strategy.FedAvg):
    def __init__(self, k_buffer_size=3, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Buffer to store the last K updates for pseudo-async median
        self.K = k_buffer_size
        self.update_buffer = []

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        if not results:
            return None, {}
        
        # Convert results to ndarrays
        weights_results = [
            (parameters_to_ndarrays(fit_res.parameters), fit_res.num_examples)
            for _, fit_res in results
        ]
        
        # Add to buffer
        for weights, num_examples in weights_results:
            self.update_buffer.append(weights)
            
        # Keep only the last K updates
        if len(self.update_buffer) > self.K:
            self.update_buffer = self.update_buffer[-self.K:]
            
        # Compute median across the buffer.
        # This is robust against outlier/malicious updates.
        median_weights = []
        for layer_idx in range(len(self.update_buffer[0])):
            layer_updates = [buffer_weights[layer_idx] for buffer_weights in self.update_buffer]
            median_weights.append(np.median(layer_updates, axis=0))
            
        parameters_aggregated = ndarrays_to_parameters(median_weights)

        return parameters_aggregated, {}
