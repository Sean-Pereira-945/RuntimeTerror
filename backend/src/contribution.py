import numpy as np
import torch
from typing import List, Dict, Optional

def calculate_shapley_weights(
    client_vectors: List[np.ndarray], 
    global_model_vector: np.ndarray
) -> np.ndarray:
    """
    Approximates Shapley values using Gradient Cosine Similarity.
    
    This evaluates how much each client's individual update aligns with 
    the aggregated direction of the global model. Highly aligned updates 
    are valued more, providing a fair way to reward clients with high-quality 
    data even if they have limited compute power.
    """
    num_clients = len(client_vectors)
    if num_clients == 0:
        return np.array([])
    if num_clients == 1:
        return np.array([1.0])

    # Normalize vectors for stable dot products
    norm_global = np.linalg.norm(global_model_vector) + 1e-9
    
    similarities = []
    for v in client_vectors:
        sim = np.dot(v, global_model_vector) / (np.linalg.norm(v) * norm_global + 1e-9)
        # Use ReLU to ignore negative contributions (harmful updates)
        similarities.append(max(0.0, float(sim)))
    
    similarities = np.array(similarities)
    total_sim = np.sum(similarities) + 1e-9
    
    # Return normalized weights
    return similarities / total_sim
