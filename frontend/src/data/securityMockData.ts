/* ──────────────────────────────────────────────────
   Security / Fault-Tolerance types & mock data
   ────────────────────────────────────────────────── */

// ── Attack timeline ──────────────────────────────────────────────────
export interface AttackEvent {
  id: number;
  timestamp: string;
  attackType: string;
  targetClient: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  defenseAction: string;
  blocked: boolean;
  details: string;
  round: number;
}

// ── Krum ─────────────────────────────────────────────────────────────
export interface KrumClientScore {
  clientName: string;
  score: number;
  accepted: boolean;
}
export interface KrumRound {
  round: number;
  clients: Record<string, KrumClientScore>;
}
export interface KrumData {
  currentRound: number;
  threshold: number;
  algorithm: string;
  rounds: KrumRound[];
}

// ── Cosine similarity ────────────────────────────────────────────────
export interface CosineData {
  round: number;
  clientIds: string[];
  matrix: number[][];
  anomalyThreshold: number;
}

// ── Rate limiting ────────────────────────────────────────────────────
export interface RateLimitClient {
  clientName: string;
  requestsPerMin: number;
  limit: number;
  blocked: boolean;
  lastSeen: string;
}
export interface RateLimitData {
  globalLimit: number;
  windowSeconds: number;
  clients: Record<string, RateLimitClient>;
  activeBlocks: number;
}

// ── ECDSA ────────────────────────────────────────────────────────────
export interface EcdsaClient {
  clientName: string;
  publicKeyFingerprint: string;
  verified: boolean;
  lastVerified: string;
  signatureAlgo: string;
}
export interface EcdsaData {
  allVerified: boolean;
  algorithm: string;
  clients: Record<string, EcdsaClient>;
}

// ── Fault-tolerance ──────────────────────────────────────────────────
export interface FaultClient {
  clientName: string;
  alive: boolean;
  missedHeartbeats: number;
  consecutiveRounds: number;
  participationRate: number;
  avgLatencyMs: number;
  lastHeartbeat: string;
  status: 'healthy' | 'degraded' | 'dead';
}
export interface FaultToleranceData {
  heartbeatIntervalSec: number;
  deadThreshold: number;
  totalRounds: number;
  clients: Record<string, FaultClient>;
  deadClients: string[];
  healthyCount: number;
}

// ── Overview metric (reused shape) ───────────────────────────────────
export interface SecurityMetric {
  id: string;
  label: string;
  value: number;
  suffix: string;
  icon: string;
  color: string;
}

// ── Aggregated security payload ──────────────────────────────────────
export interface SecuritySummary {
  overviewMetrics: SecurityMetric[];
  krum: KrumData;
  cosineSimilarity: CosineData;
  rateLimit: RateLimitData;
  ecdsa: EcdsaData;
  faultTolerance: FaultToleranceData;
  recentAttacks: AttackEvent[];
}

// ── Self-improvement model metrics ───────────────────────────────────
export interface SelfImprovementPoint {
  round: number;
  accuracy: number;
  loss: number;
  f1: number;
  precision: number;
  recall: number;
  learningRate: number;
}

// ── Dynamic Schema ───────────────────────────────────────────────────
export interface SchemaField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'category';
  required: boolean;
  description: string;
}
export interface SchemaConfig {
  fields: SchemaField[];
  exampleFields: SchemaField[];
}

// ── Multi-Modal Fusion ───────────────────────────────────────────────
export interface ModalityConfig {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  weight: number;
  description: string;
  color: string;
}
export interface MultiModalConfig {
  fusionMethod: 'late' | 'early' | 'attention';
  modalities: ModalityConfig[];
}

// ── Bot Integration ──────────────────────────────────────────────────
export interface BotPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  webhook: string;
  commands: string[];
}
export interface BotsConfig {
  platforms: BotPlatform[];
}

// ── Email Training ───────────────────────────────────────────────────
export interface EmailConfig {
  enabled: boolean;
  address: string;
  provider: string;
  format: 'csv_attachment' | 'inline_text' | 'link';
}
export interface EmailLog {
  id: number;
  from: string;
  subject: string;
  timestamp: string;
  status: 'processed' | 'rejected' | 'pending';
  rows: number;
}
export interface EmailData {
  config: EmailConfig;
  logs: EmailLog[];
}

// ══════════════════════════════════════════════════════════════════════
//  Mock data for fallback
// ══════════════════════════════════════════════════════════════════════

const _ts = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60_000).toISOString();

export const mockAttackEvents: AttackEvent[] = [
  { id: 1, timestamp: _ts(2),  attackType: 'byzantine_gradient', targetClient: 'Phone',    severity: 'high',     defenseAction: 'krum_filter',       blocked: true,  details: 'Anomalous gradient vector from Phone — L2-norm 4.7× above mean', round: 47 },
  { id: 2, timestamp: _ts(6),  attackType: 'ddos_flood',         targetClient: 'Clothing',  severity: 'critical', defenseAction: 'rate_limit',        blocked: true,  details: 'Clothing endpoint received 342 req/s — 17× normal rate',         round: 46 },
  { id: 3, timestamp: _ts(10), attackType: 'model_poisoning',    targetClient: 'Food',      severity: 'medium',   defenseAction: 'cosine_reject',     blocked: true,  details: 'Food submitted weights diverging from global model by 38%',       round: 45 },
  { id: 4, timestamp: _ts(15), attackType: 'sybil_node',         targetClient: 'Phone',    severity: 'high',     defenseAction: 'ecdsa_block',       blocked: true,  details: 'Duplicate identity detected mimicking Phone fingerprint',         round: 44 },
  { id: 5, timestamp: _ts(20), attackType: 'free_rider',         targetClient: 'Clothing',  severity: 'low',      defenseAction: 'anomaly_quarantine',blocked: false, details: 'Clothing gradient update near-zero (cosine-sim to null = 0.97)', round: 43 },
  { id: 6, timestamp: _ts(25), attackType: 'label_flip',         targetClient: 'Food',      severity: 'medium',   defenseAction: 'gradient_clip',     blocked: true,  details: 'Medium label-flip pattern in 12% of Food samples',               round: 42 },
  { id: 7, timestamp: _ts(30), attackType: 'data_poisoning',     targetClient: 'Phone',    severity: 'high',     defenseAction: 'reputation_decay',  blocked: true,  details: 'Label distribution shift detected in Phone batch (KL = 0.82)',    round: 41 },
  { id: 8, timestamp: _ts(38), attackType: 'byzantine_gradient', targetClient: 'Clothing',  severity: 'medium',   defenseAction: 'krum_filter',       blocked: true,  details: 'Anomalous gradient vector from Clothing — L2-norm 3.2× above mean', round: 40 },
  { id: 9, timestamp: _ts(45), attackType: 'ddos_flood',         targetClient: 'Food',      severity: 'critical', defenseAction: 'rate_limit',        blocked: true,  details: 'Food endpoint received 280 req/s — 14× normal rate',             round: 39 },
  { id:10, timestamp: _ts(50), attackType: 'model_poisoning',    targetClient: 'Phone',    severity: 'low',      defenseAction: 'cosine_reject',     blocked: true,  details: 'Phone submitted weights diverging from global model by 15%',      round: 38 },
];

export const mockKrumData: KrumData = {
  currentRound: 47,
  threshold: 0.75,
  algorithm: 'Multi-Krum (f=1)',
  rounds: Array.from({ length: 10 }, (_, i) => ({
    round: 38 + i,
    clients: {
      '0': { clientName: 'Phone',    score: 0.93 + i * 0.003, accepted: true },
      '1': { clientName: 'Clothing', score: 0.91 + i * 0.004, accepted: true },
      '2': { clientName: 'Food',     score: 0.94 + i * 0.002, accepted: true },
    },
  })),
};

export const mockCosineData: CosineData = {
  round: 47,
  clientIds: ['Phone', 'Clothing', 'Food'],
  matrix: [
    [1.0,   0.89, 0.87],
    [0.89,  1.0,  0.91],
    [0.87,  0.91, 1.0 ],
  ],
  anomalyThreshold: 0.60,
};

export const mockFaultTolerance: FaultToleranceData = {
  heartbeatIntervalSec: 5,
  deadThreshold: 3,
  totalRounds: 47,
  clients: {
    '0': { clientName: 'Phone',    alive: true,  missedHeartbeats: 0, consecutiveRounds: 47, participationRate: 100,  avgLatencyMs: 23.4, lastHeartbeat: _ts(0.1), status: 'healthy'  },
    '1': { clientName: 'Clothing', alive: true,  missedHeartbeats: 1, consecutiveRounds: 45, participationRate: 95.7, avgLatencyMs: 45.2, lastHeartbeat: _ts(0.3), status: 'degraded' },
    '2': { clientName: 'Food',     alive: true,  missedHeartbeats: 0, consecutiveRounds: 47, participationRate: 100,  avgLatencyMs: 18.9, lastHeartbeat: _ts(0.05),status: 'healthy'  },
  },
  deadClients: [],
  healthyCount: 3,
};

export const mockSecurityOverview: SecurityMetric[] = [
  { id: 'attacks_blocked', label: 'Attacks Blocked',  value: 9,    suffix: '/10', icon: 'shield', color: 'from-emerald-500 to-green-400'  },
  { id: 'byzantine_score', label: 'Avg Krum Score',   value: 0.952,suffix: '',    icon: 'krum',   color: 'from-blue-500 to-cyan-400'      },
  { id: 'healthy_clients', label: 'Healthy Clients',  value: 3,    suffix: '/3',  icon: 'heart',  color: 'from-violet-500 to-purple-400'  },
  { id: 'ecdsa_verified',  label: 'ECDSA Verified',   value: 3,    suffix: '/3',  icon: 'lock',   color: 'from-amber-500 to-orange-400'   },
];

export const mockSelfImprovement: SelfImprovementPoint[] = Array.from({ length: 47 }, (_, i) => {
  const r = i + 1;
  return {
    round: r,
    accuracy: 58 + (94.2 - 58) * (1 - Math.exp(-r / 15)),
    loss: 2.41 * Math.exp(-r / 12) + 0.26,
    f1: 55 + (92 - 55) * (1 - Math.exp(-r / 16)),
    precision: 57 + (93 - 57) * (1 - Math.exp(-r / 14)),
    recall: 54 + (91 - 54) * (1 - Math.exp(-r / 17)),
    learningRate: 2e-5 * Math.pow(0.98, r),
  };
});
