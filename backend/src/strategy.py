import os
import json
from datetime import datetime
import time
import flwr as fl
import numpy as np
from typing import List, Tuple, Optional, Dict, Union
import torch
from src.transformer_model import TransformerWrapper
from flwr.common import FitRes, Parameters, Scalar, ndarrays_to_parameters, parameters_to_ndarrays
from flwr.server.client_proxy import ClientProxy

# Resolve paths relative to backend/ directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GLOBAL_MODEL_PATH = os.path.join(BACKEND_DIR, "global_model.pth")

class SaveMetricsStrategy(fl.server.strategy.FedAvg):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.metrics_file = os.path.join(BACKEND_DIR, "data", "fl_metrics.json")
        os.makedirs(os.path.dirname(self.metrics_file), exist_ok=True)
        # Initialize or clear metrics file
        with open(self.metrics_file, "w") as f:
            json.dump([], f)
        
        # Create model shell once for weight injection (avoids re-downloading every round)
        self._model = TransformerWrapper()
        
        # Map Flower UUID client IDs → sequential integers (0, 1, 2)
        self.client_id_map: Dict[str, int] = {}
        self._next_client_id = 0
        
        # Track round start times for duration calculation
        self._round_start_time: Optional[float] = None

    def _get_sequential_id(self, flower_cid: str) -> int:
        """Map a Flower UUID client ID to a stable sequential integer."""
        if flower_cid not in self.client_id_map:
            self.client_id_map[flower_cid] = self._next_client_id
            self._next_client_id += 1
        return self.client_id_map[flower_cid]

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        
        self._round_start_time = time.time()
        
        # Register client IDs during fit
        for client, _ in results:
            self._get_sequential_id(client.cid)
        
        aggregated_parameters, aggregated_metrics = super().aggregate_fit(server_round, results, failures)
        
        if aggregated_parameters is not None:
            # Convert Flower Parameters back to NumPy arrays
            ndarrays = parameters_to_ndarrays(aggregated_parameters)
            
            # Get the model state_dict keys and inject aggregated weights
            state_dict = self._model.state_dict()
            keys = list(state_dict.keys())
            for key, array in zip(keys, ndarrays):
                state_dict[key] = torch.tensor(array)
            
            self._model.load_state_dict(state_dict, strict=True)
            
            # Persist so inference endpoints pick it up
            torch.save(self._model.state_dict(), GLOBAL_MODEL_PATH)
            print(f"[Round {server_round}] Saved aggregated model to {GLOBAL_MODEL_PATH}")
            
        return aggregated_parameters, aggregated_metrics


    def aggregate_evaluate(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, fl.common.EvaluateRes]],
        failures: List[Union[Tuple[ClientProxy, fl.common.EvaluateRes], BaseException]],
    ) -> Tuple[Optional[float], Dict[str, fl.common.Scalar]]:
        
        aggregated_loss, aggregated_metrics = super().aggregate_evaluate(server_round, results, failures)
        
        # Calculate round duration
        duration_s = 0.0
        if self._round_start_time is not None:
            duration_s = time.time() - self._round_start_time
        
        if aggregated_loss is not None:
            # Gather client accuracies with mapped sequential IDs
            client_metrics = []
            for client, res in results:
                seq_id = self._get_sequential_id(client.cid)
                client_metrics.append({
                    "client_id": seq_id,
                    "accuracy": res.metrics.get("accuracy", 0.0) if res.metrics else 0.0,
                    "loss": float(res.loss)
                })
            
            # Compute global average accuracy
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
                "duration": f"{duration_s:.1f}s",
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
            
            print(f"[Round {server_round}] Global accuracy: {global_accuracy*100:.1f}%, Loss: {aggregated_loss:.4f}, Duration: {duration_s:.1f}s")

        return aggregated_loss, aggregated_metrics
