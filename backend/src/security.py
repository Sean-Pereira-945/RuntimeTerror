"""
Security Simulation Engine for Federated Learning
──────────────────────────────────────────────────
Simulates Byzantine defence (Krum, cosine-similarity screening),
DDoS / rate-limiting, ECDSA signature verification, fault-tolerance
heartbeats and dead-client exclusion.

All data is *deterministically generated* from the current FL metrics
so that the demo looks realistic without requiring a real attack surface.
"""

import os
import json
import math
import random
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METRICS_FILE = os.path.join(BACKEND_DIR, "data", "fl_metrics.json")

# ── Client definitions (must match api.py / strategy.py) ─────────────
CLIENT_DEFS = {
    0: {"name": "Phone Store A", "shortName": "Phone",    "color": "#3b82f6"},
    1: {"name": "Clothing Store B", "shortName": "Clothing", "color": "#8b5cf6"},
    2: {"name": "Food Store C",    "shortName": "Food",     "color": "#ec4899"},
}

ATTACK_TYPES = [
    "byzantine_gradient",
    "model_poisoning",
    "sybil_node",
    "ddos_flood",
    "data_poisoning",
    "label_flip",
    "free_rider",
]

DEFENSE_ACTIONS = [
    "krum_filter",
    "cosine_reject",
    "rate_limit",
    "ecdsa_block",
    "anomaly_quarantine",
    "gradient_clip",
    "reputation_decay",
]


def _load_metrics() -> list:
    if os.path.exists(METRICS_FILE):
        try:
            with open(METRICS_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    return []


def _seed_from_round(server_round: int) -> random.Random:
    """Deterministic RNG per round so data is stable across calls."""
    return random.Random(server_round * 7919)


# ══════════════════════════════════════════════════════════════════════
#  Byzantine Defence (Krum / Cosine-similarity screening)
# ══════════════════════════════════════════════════════════════════════

def krum_scores(server_round: int | None = None) -> Dict:
    """Return per-client Krum scores for the latest (or given) round."""
    metrics = _load_metrics()
    if not metrics:
        # Generate realistic demo data
        rng = _seed_from_round(server_round or 1)
        return _generate_krum_scores(rng, server_round or 1, num_rounds=10)

    target = server_round or len(metrics)
    rng = _seed_from_round(target)
    return _generate_krum_scores(rng, target, num_rounds=len(metrics))


def _generate_krum_scores(rng: random.Random, current_round: int, num_rounds: int) -> Dict:
    rounds_data = []
    for r in range(1, num_rounds + 1):
        r_rng = _seed_from_round(r)
        clients = {}
        for cid, cdef in CLIENT_DEFS.items():
            base = 0.92 + r * 0.004
            score = min(base + r_rng.gauss(0, 0.02), 1.0)
            clients[str(cid)] = {
                "clientName": cdef["shortName"],
                "score": round(max(score, 0.6), 4),
                "accepted": score > 0.75,
            }
        rounds_data.append({"round": r, "clients": clients})

    return {
        "currentRound": current_round,
        "threshold": 0.75,
        "algorithm": "Multi-Krum (f=1)",
        "rounds": rounds_data,
    }


def cosine_similarity_matrix(server_round: int | None = None) -> Dict:
    """NxN cosine similarity between client gradient updates."""
    metrics = _load_metrics()
    target = server_round or max(len(metrics), 1)
    rng = _seed_from_round(target)

    ids = list(CLIENT_DEFS.keys())
    matrix = []
    for i in ids:
        row = []
        for j in ids:
            if i == j:
                row.append(1.0)
            else:
                sim = 0.85 + rng.gauss(0, 0.06)
                row.append(round(max(min(sim, 1.0), 0.3), 4))
        matrix.append(row)

    return {
        "round": target,
        "clientIds": [CLIENT_DEFS[c]["shortName"] for c in ids],
        "matrix": matrix,
        "anomalyThreshold": 0.60,
    }


# ══════════════════════════════════════════════════════════════════════
#  DDoS / Rate Limiting
# ══════════════════════════════════════════════════════════════════════

def rate_limit_status() -> Dict:
    """Simulated per-client rate-limit counters."""
    rng = random.Random(int(time.time()) // 30)  # changes every 30 s
    clients = {}
    for cid, cdef in CLIENT_DEFS.items():
        req_per_min = rng.randint(2, 15)
        limit = 20
        blocked = req_per_min > limit
        clients[str(cid)] = {
            "clientName": cdef["shortName"],
            "requestsPerMin": req_per_min,
            "limit": limit,
            "blocked": blocked,
            "lastSeen": (datetime.now() - timedelta(seconds=rng.randint(1, 120))).isoformat(),
        }

    return {
        "globalLimit": 20,
        "windowSeconds": 60,
        "clients": clients,
        "activeBlocks": sum(1 for c in clients.values() if c["blocked"]),
    }


# ══════════════════════════════════════════════════════════════════════
#  ECDSA Signature Verification (simulated)
# ══════════════════════════════════════════════════════════════════════

def ecdsa_status() -> Dict:
    """Simulated ECDSA handshake verification per client."""
    base_time = datetime.now()
    clients = {}
    for cid, cdef in CLIENT_DEFS.items():
        pub_key_hash = hashlib.sha256(f"client-{cid}-pubkey".encode()).hexdigest()[:16]
        clients[str(cid)] = {
            "clientName": cdef["shortName"],
            "publicKeyFingerprint": pub_key_hash,
            "verified": True,
            "lastVerified": (base_time - timedelta(minutes=cid * 2 + 1)).isoformat(),
            "signatureAlgo": "ECDSA-secp256k1",
        }

    return {
        "allVerified": True,
        "algorithm": "ECDSA-secp256k1",
        "clients": clients,
    }


# ══════════════════════════════════════════════════════════════════════
#  Fault Tolerance  —  Heartbeats & Dead Client Exclusion
# ══════════════════════════════════════════════════════════════════════

def fault_tolerance_status() -> Dict:
    """Simulated heartbeat + participation data per client."""
    metrics = _load_metrics()
    total_rounds = max(len(metrics), 10)
    now = datetime.now()
    rng = random.Random(int(time.time()) // 10)

    clients = {}
    for cid, cdef in CLIENT_DEFS.items():
        missed = rng.randint(0, 2)
        streak = rng.randint(3, total_rounds)
        latency = round(rng.uniform(15, 120), 1)
        alive = missed < 3
        clients[str(cid)] = {
            "clientName": cdef["shortName"],
            "alive": alive,
            "missedHeartbeats": missed,
            "consecutiveRounds": streak,
            "participationRate": round((total_rounds - missed) / total_rounds * 100, 1),
            "avgLatencyMs": latency,
            "lastHeartbeat": (now - timedelta(seconds=rng.randint(2, 30))).isoformat(),
            "status": "healthy" if missed == 0 else ("degraded" if missed < 3 else "dead"),
        }

    return {
        "heartbeatIntervalSec": 5,
        "deadThreshold": 3,
        "totalRounds": total_rounds,
        "clients": clients,
        "deadClients": [c["clientName"] for c in clients.values() if not c["alive"]],
        "healthyCount": sum(1 for c in clients.values() if c["alive"]),
    }


# ══════════════════════════════════════════════════════════════════════
#  Attack Timeline  —  simulated event log
# ══════════════════════════════════════════════════════════════════════

def attack_timeline(limit: int = 50) -> List[Dict]:
    """Generate a plausible attack + defence event log."""
    events = []
    base_time = datetime.now()
    rng = random.Random(42)

    for i in range(limit):
        attack = rng.choice(ATTACK_TYPES)
        defence = rng.choice(DEFENSE_ACTIONS)
        cid = rng.choice(list(CLIENT_DEFS.keys()))
        severity = rng.choice(["low", "medium", "high", "critical"])
        blocked = rng.random() > 0.15  # 85 % blocked

        ts = base_time - timedelta(minutes=i * rng.randint(2, 8))
        events.append({
            "id": i + 1,
            "timestamp": ts.isoformat(),
            "attackType": attack,
            "targetClient": CLIENT_DEFS[cid]["shortName"],
            "severity": severity,
            "defenseAction": defence,
            "blocked": blocked,
            "details": _attack_detail(attack, CLIENT_DEFS[cid]["shortName"], severity),
            "round": max(1, rng.randint(1, 47)),
        })

    return events


def _attack_detail(attack: str, client: str, severity: str) -> str:
    templates = {
        "byzantine_gradient": f"Anomalous gradient vector from {client} — L2-norm 4.7× above mean",
        "model_poisoning": f"{client} submitted weights diverging from global model by 38%",
        "sybil_node": f"Duplicate identity detected mimicking {client} fingerprint",
        "ddos_flood": f"{client} endpoint received 342 req/s — 17× normal rate",
        "data_poisoning": f"Label distribution shift detected in {client} batch (KL = 0.82)",
        "label_flip": f"{severity.title()} label-flip pattern in 12% of {client} samples",
        "free_rider": f"{client} gradient update near-zero (cosine-sim to null = 0.97)",
    }
    return templates.get(attack, f"Unknown attack on {client}")


# ══════════════════════════════════════════════════════════════════════
#  Security Summary (aggregated overview)
# ══════════════════════════════════════════════════════════════════════

def security_summary() -> Dict:
    krum = krum_scores()
    cosine = cosine_similarity_matrix()
    rate = rate_limit_status()
    ecdsa = ecdsa_status()
    ft = fault_tolerance_status()
    attacks = attack_timeline(30)

    blocked = sum(1 for a in attacks if a["blocked"])
    total = len(attacks)

    return {
        "overviewMetrics": [
            {"id": "attacks_blocked", "label": "Attacks Blocked", "value": blocked, "suffix": f"/{total}", "icon": "shield", "color": "from-emerald-500 to-green-400"},
            {"id": "byzantine_score", "label": "Avg Krum Score", "value": round(sum(
                c["score"] for r in krum["rounds"][-1:] for c in r["clients"].values()
            ) / max(len(CLIENT_DEFS), 1), 3), "suffix": "", "icon": "krum", "color": "from-blue-500 to-cyan-400"},
            {"id": "healthy_clients", "label": "Healthy Clients", "value": ft["healthyCount"], "suffix": f"/{len(CLIENT_DEFS)}", "icon": "heart", "color": "from-violet-500 to-purple-400"},
            {"id": "ecdsa_verified", "label": "ECDSA Verified", "value": sum(1 for c in ecdsa["clients"].values() if c["verified"]), "suffix": f"/{len(CLIENT_DEFS)}", "icon": "lock", "color": "from-amber-500 to-orange-400"},
        ],
        "krum": krum,
        "cosineSimilarity": cosine,
        "rateLimit": rate,
        "ecdsa": ecdsa,
        "faultTolerance": ft,
        "recentAttacks": attacks[:10],
    }
