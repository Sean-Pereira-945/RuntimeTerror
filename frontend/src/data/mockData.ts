/* ──────────────────────────────────────────────────
   Mock data — looks realistic for DevHacks 2026
   ────────────────────────────────────────────────── */

/** Client organizations for Globe3D */
export interface ClientOrg {
  name: string;
  lat: number;
  lng: number;
  color: string;
  icon: string;
}

export const CLIENT_ORGS: ClientOrg[] = [
  { name: 'New York',  lat: 40.7128,  lng: -74.0060,  color: '#8b5cf6', icon: '🏥' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, color: '#ec4899', icon: '🔬' },
  { name: 'Chicago',   lat: 41.8781,  lng: -87.6298,  color: '#06b6d4', icon: '🏛️' },
  { name: 'Boston',    lat: 42.3601,  lng: -71.0589,  color: '#f59e0b', icon: '📊' },
  { name: 'Seattle',   lat: 47.6062,  lng: -122.3321, color: '#10b981', icon: '💻' },
];

/** Global model accuracy over 47 federated rounds (60% → 94.2%) */
export const accuracyOverRounds: number[] = [
  58.3, 61.7, 64.2, 66.8, 69.1, 71.5, 73.2, 74.8, 76.1, 77.4,
  78.6, 79.5, 80.3, 81.1, 81.8, 82.4, 83.0, 83.5, 84.0, 84.5,
  85.0, 85.4, 85.8, 86.2, 86.6, 87.0, 87.4, 87.8, 88.2, 88.6,
  89.0, 89.3, 89.6, 89.9, 90.2, 90.5, 90.8, 91.1, 91.4, 91.7,
  92.0, 92.3, 92.6, 92.9, 93.3, 93.7, 94.2,
];

/** Corresponding loss values */
export const lossOverRounds: number[] = [
  2.41, 2.18, 1.97, 1.79, 1.63, 1.49, 1.37, 1.26, 1.17, 1.09,
  1.02, 0.96, 0.90, 0.85, 0.81, 0.77, 0.73, 0.70, 0.67, 0.64,
  0.61, 0.59, 0.57, 0.55, 0.53, 0.51, 0.49, 0.47, 0.46, 0.44,
  0.43, 0.41, 0.40, 0.39, 0.38, 0.37, 0.36, 0.35, 0.34, 0.33,
  0.32, 0.31, 0.30, 0.29, 0.28, 0.27, 0.26,
];

/** Round labels 1‥47 */
export const roundLabels: string[] = Array.from({ length: 47 }, (_, i) => `R${i + 1}`);

/** Per-client accuracy curves */
export const clientAccuracyCurves: Record<string, number[]> = {
  'Hospital A': [
    57.1, 60.2, 63.5, 66.0, 68.3, 70.7, 72.5, 74.1, 75.4, 76.8,
    78.0, 79.0, 79.8, 80.6, 81.3, 81.9, 82.5, 83.0, 83.5, 84.0,
    84.4, 84.8, 85.2, 85.6, 86.0, 86.4, 86.8, 87.2, 87.6, 88.0,
    88.3, 88.6, 88.9, 89.2, 89.5, 89.8, 90.1, 90.4, 90.7, 91.0,
    91.3, 91.6, 91.9, 92.1, 92.4, 92.6, 92.8,
  ],
  'Lab B': [
    55.8, 59.1, 62.3, 64.9, 67.1, 69.5, 71.2, 72.8, 74.1, 75.3,
    76.5, 77.4, 78.2, 79.0, 79.7, 80.3, 80.9, 81.4, 81.9, 82.4,
    82.8, 83.2, 83.6, 84.0, 84.4, 84.8, 85.2, 85.6, 86.0, 86.3,
    86.6, 86.9, 87.2, 87.5, 87.8, 88.1, 88.4, 88.7, 89.0, 89.3,
    89.6, 89.9, 90.2, 90.5, 90.9, 91.2, 91.5,
  ],
  'Univ C': [
    59.2, 62.5, 65.1, 67.5, 69.8, 72.2, 73.9, 75.5, 76.8, 78.1,
    79.3, 80.2, 81.0, 81.8, 82.5, 83.1, 83.7, 84.2, 84.7, 85.2,
    85.6, 86.0, 86.4, 86.8, 87.2, 87.6, 88.0, 88.4, 88.8, 89.1,
    89.4, 89.7, 90.0, 90.3, 90.6, 90.9, 91.2, 91.5, 91.8, 92.1,
    92.4, 92.7, 93.0, 93.3, 93.6, 93.9, 93.1,
  ],
};

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

export const clients: Client[] = [
  {
    id: 'client-a',
    name: 'Hospital A — Metro General',
    shortName: 'Hospital A',
    dataPoints: 12_450,
    localAccuracy: 92.8,
    roundsParticipated: 47,
    status: 'active',
    lastActive: '2 min ago',
    color: '#3b82f6',
    contribution: 34.2,
  },
  {
    id: 'client-b',
    name: 'Research Lab B — BioTech Inc',
    shortName: 'Lab B',
    dataPoints: 8_320,
    localAccuracy: 91.5,
    roundsParticipated: 45,
    status: 'active',
    lastActive: '5 min ago',
    color: '#8b5cf6',
    contribution: 28.7,
  },
  {
    id: 'client-c',
    name: 'University C — Stanford ML',
    shortName: 'Univ C',
    dataPoints: 15_780,
    localAccuracy: 93.1,
    roundsParticipated: 47,
    status: 'active',
    lastActive: '1 min ago',
    color: '#ec4899',
    contribution: 37.1,
  },
];

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

export const trainingHistory: TrainingRound[] = [
  { round: 47, timestamp: '2026-02-21 14:32:18', globalAccuracy: 94.2, loss: 0.26, participants: 3, duration: '2.3s', status: 'completed' },
  { round: 46, timestamp: '2026-02-21 14:28:45', globalAccuracy: 93.7, loss: 0.27, participants: 3, duration: '2.1s', status: 'completed' },
  { round: 45, timestamp: '2026-02-21 14:24:12', globalAccuracy: 93.3, loss: 0.28, participants: 3, duration: '2.4s', status: 'completed' },
  { round: 44, timestamp: '2026-02-21 14:20:33', globalAccuracy: 92.9, loss: 0.29, participants: 3, duration: '2.2s', status: 'completed' },
  { round: 43, timestamp: '2026-02-21 14:16:51', globalAccuracy: 92.6, loss: 0.30, participants: 2, duration: '2.5s', status: 'completed' },
  { round: 42, timestamp: '2026-02-21 14:12:08', globalAccuracy: 92.3, loss: 0.31, participants: 3, duration: '2.3s', status: 'completed' },
  { round: 41, timestamp: '2026-02-21 14:08:29', globalAccuracy: 92.0, loss: 0.32, participants: 3, duration: '2.1s', status: 'completed' },
  { round: 40, timestamp: '2026-02-21 14:04:47', globalAccuracy: 91.7, loss: 0.33, participants: 3, duration: '2.6s', status: 'completed' },
  { round: 39, timestamp: '2026-02-21 14:00:15', globalAccuracy: 91.4, loss: 0.34, participants: 2, duration: '2.4s', status: 'completed' },
  { round: 38, timestamp: '2026-02-21 13:56:33', globalAccuracy: 91.1, loss: 0.35, participants: 3, duration: '2.2s', status: 'completed' },
  { round: 37, timestamp: '2026-02-21 13:52:50', globalAccuracy: 90.8, loss: 0.36, participants: 3, duration: '2.3s', status: 'completed' },
  { round: 36, timestamp: '2026-02-21 13:48:12', globalAccuracy: 90.5, loss: 0.37, participants: 3, duration: '2.5s', status: 'completed' },
];

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

export const adminMetrics: MetricCard[] = [
  {
    id: 'accuracy',
    label: 'Global Model Accuracy',
    value: 94.2,
    suffix: '%',
    trend: 2.1,
    trendLabel: 'vs last round',
    icon: 'accuracy',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    id: 'clients',
    label: 'Active Clients',
    value: 3,
    suffix: '/3',
    trend: 0,
    trendLabel: 'all connected',
    icon: 'clients',
    color: 'from-violet-500 to-purple-400',
  },
  {
    id: 'rounds',
    label: 'Training Rounds',
    value: 47,
    suffix: '',
    trend: 4.3,
    trendLabel: 'this session',
    icon: 'rounds',
    color: 'from-pink-500 to-rose-400',
  },
  {
    id: 'convergence',
    label: 'Avg Convergence',
    value: 2.3,
    suffix: 's',
    trend: -12.5,
    trendLabel: 'faster than avg',
    icon: 'convergence',
    color: 'from-amber-500 to-orange-400',
  },
];

/** Client-specific metrics for the personal dashboard */
export const clientPersonalMetrics = {
  localAccuracy: 92.8,
  datasetSize: 12_450,
  roundsTrained: 47,
  lastRoundTime: '2.3s',
  modelVersion: 'v47.2',
  nextScheduled: '~4 min',
};

/** Simulated file uploads */
export const recentUploads = [
  { name: 'patient_records_batch_12.csv', size: '2.4 MB', date: '2026-02-21', rows: 3200 },
  { name: 'lab_results_q1_2026.csv', size: '1.8 MB', date: '2026-02-20', rows: 2450 },
  { name: 'imaging_metadata_v3.json', size: '890 KB', date: '2026-02-19', rows: 1800 },
];
