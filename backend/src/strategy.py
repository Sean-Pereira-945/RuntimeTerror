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
from src.contribution import calculate_shapley_weights

# Resolve paths relative to backend/ directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GLOBAL_MODEL_PATH = os.path.join(BACKEND_DIR, "global_model.pth")
STATUS_FILE = os.path.join(BACKEND_DIR, "data", "training_status.json")


def _update_training_status(server_round: int, total_rounds: int, accuracy: float, loss: float):
    """Write per-round training progress so the API can serve it."""
    try:
        data = {
            "status": "running",
            "currentRound": server_round,
            "totalRounds": total_rounds,
            "accuracy": round(accuracy * 100, 1),
            "loss": round(loss, 4),
            "message": f"Round {server_round}/{total_rounds} complete — {accuracy*100:.1f}% accuracy",
            "ts": time.time(),
        }
        os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)
        with open(STATUS_FILE, "w") as f:
            json.dump(data, f)
    except Exception as e:
        print(f"[Strategy] Failed to write training status: {e}")

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

        if not results:
            return None, {}

        # ── Krum & Cosine Filtering ──────────────────────────────────────
        # Convert parameters to ndarrays for distance/similarity calculation
        client_ndarrays = [parameters_to_ndarrays(res.parameters) for _, res in results]
        
        # Flatten and concatenate weight arrays for each client to get a single vector
        vectors = [np.concatenate([a.flatten() for a in nds]) for nds in client_ndarrays]
        
        num_clients = len(vectors)
        f = 1  # Number of tolerated byzantine clients
        m = num_clients - f - 2 # Neighbors to consider
        
        if num_clients > 2:
            # 1. Krum Scoring
            scores = []
            for i in range(num_clients):
                dists = []
                for j in range(num_clients):
                    if i == j: continue
                    dists.append(np.linalg.norm(vectors[i] - vectors[j])**2)
                dists.sort()
                scores.append(sum(dists[:max(1, m)]))
            
            # 2. Cosine Similarity Check (relative to mean of all updates)
            mean_vector = np.mean(vectors, axis=0)
            similarities = []
            for v in vectors:
                sim = np.dot(v, mean_vector) / (np.linalg.norm(v) * np.linalg.norm(mean_vector) + 1e-9)
                similarities.append(sim)
            
            # Combine logic: keep clients with good similarity OR the best Krum winner
            best_idx = np.argmin(scores)
            accepted_indices = [i for i, sim in enumerate(similarities) if sim > 0.6]
            
            # Ensure at least the Krum winner is included
            if best_idx not in accepted_indices:
                accepted_indices.append(best_idx)
            
            print(f"[Security] Round {server_round}: Filtered {num_clients - len(accepted_indices)} anomalous updates.")
            
            filtered_results = [results[i] for i in accepted_indices]
            filtered_vectors = [vectors[i] for i in accepted_indices]
        else:
            filtered_results = results
            filtered_vectors = vectors

        # ── Shapley Weighted Aggregation ──────────────────────────────────
        if filtered_results:
            # We use Gradient Cosine Similarity as a Shapley approximation
            # relative to the mean of the filtered (clean) updates.
            clean_mean_vector = np.mean(filtered_vectors, axis=0)
            shapley_weights = calculate_shapley_weights(filtered_vectors, clean_mean_vector)
            
            print(f"[Shapley] Round {server_round}: Calculated contribution weights: {shapley_weights}")
            
            # Create weighted updates for aggregation
            # We override the sample counts in FitRes with Shapley-based weights 
            # to influence FedAvg's weighted average.
            total_weight = sum(shapley_weights)
            for i, (client, res) in enumerate(filtered_results):
                # Map 0-1 weight back to a 'virtual' sample count for FedAvg
                res.num_examples = int(shapley_weights[i] * 1000) 
        
        aggregated_parameters, aggregated_metrics = super().aggregate_fit(server_round, filtered_results, failures)
        
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

            # Update training status for the API to serve
            from src.main import NUM_ROUNDS
            _update_training_status(server_round, NUM_ROUNDS, global_accuracy, aggregated_loss)

        return aggregated_loss, aggregated_metrics
