/* ──────────────────────────────────────────────────
   Shared TypeScript interfaces used across
   dashboards and API layer.  No runtime values.
   ────────────────────────────────────────────────── */

/** Client organizations for Globe3D */
export interface ClientOrg {
  name: string;
  lat: number;
  lng: number;
  color: string;
  icon: string;
}

/** Federated clients */
export interface Client {
  id: string;
  name: string;
  shortName: string;
  dataPoints: number;
  localAccuracy: number;
  roundsParticipated: number;
  status: 'active' | 'idle' | 'offline';
  lastActive: string;
  color: string;
  contribution: number;
  uptime?: number;
}

/** Training history rows */
export interface TrainingRound {
  round: number;
  timestamp: string;
  globalAccuracy: number;
  loss: number;
  participants: number;
  duration: string;
  status: 'completed' | 'in-progress' | 'failed';
}

/** Admin dashboard metric cards */
export interface MetricCard {
  id: string;
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
  trend: number;
  trendLabel: string;
  icon: string;
  color: string;
}
