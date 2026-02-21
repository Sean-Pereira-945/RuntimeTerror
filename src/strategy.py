import flwr as fl
import numpy as np
from typing import List, Tuple, Optional, Dict, Union
from flwr.common import FitRes, Parameters, Scalar, ndarrays_to_parameters, parameters_to_ndarrays
from flwr.server.client_proxy import ClientProxy

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
