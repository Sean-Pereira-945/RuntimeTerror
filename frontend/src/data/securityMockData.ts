/* ──────────────────────────────────────────────────
   Security / Fault-Tolerance types.
   No runtime values — all data comes from the API.
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



