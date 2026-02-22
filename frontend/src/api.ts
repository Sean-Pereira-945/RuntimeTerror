// Value imports removed — all fallbacks use empty defaults
import type {
    SecuritySummary,
    AttackEvent,
    FaultToleranceData,
    SelfImprovementPoint,
    SchemaConfig,
    MultiModalConfig,
    BotsConfig,
} from './data/securityMockData';
import type { MetricCard, Client, TrainingRound } from './data/mockData';
import { getAuthHeaders } from './context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Merge auth headers with any additional headers */
function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return { ...getAuthHeaders(), ...extra };
}

export async function fetchMetrics() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/metrics`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable for metrics");
        return {
            accuracyOverRounds: [] as number[],
            lossOverRounds: [] as number[],
            roundLabels: [] as string[],
            adminMetrics: [] as MetricCard[],
        };
    }
}

export async function fetchClients() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/clients`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable for clients");
        return {
            clients: [] as Client[],
            clientAccuracyCurves: {} as Record<string, number[]>,
        };
    }
}

export async function fetchHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/history`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable for history");
        return {
            trainingHistory: [] as TrainingRound[],
        };
    }
}

export async function predictSentiment(text: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable for prediction");
        throw error;
    }
}

export async function startTraining() {
    const response = await fetch(`${API_BASE_URL}/api/train`, {
        method: "POST",
        headers: authHeaders(),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Training failed' }));
        throw new Error(err.detail || 'Failed to start training');
    }
    return await response.json();
}

export interface TrainingStatus {
    status: 'idle' | 'starting' | 'running' | 'completed' | 'failed';
    currentRound?: number;
    totalRounds?: number;
    accuracy?: number;
    loss?: number;
    message?: string;
    ts?: number;
}

export async function fetchTrainingStatus(): Promise<TrainingStatus> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/train/status`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch {
        return { status: 'idle' };
    }
}

export interface UploadPreview {
    stagingId: string;
    filename: string;
    columns: string[];
    rows: number;
    preview: Record<string, unknown>[];
}

export async function uploadPreview(file: File): Promise<UploadPreview> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload-preview`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload preview failed');
    }
    return response.json();
}

export async function finalizeUpload(
    clientId: string,
    stagingId: string,
    selectedColumns: string[],
) {
    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('staging_id', stagingId);
    formData.append('selected_columns', JSON.stringify(selectedColumns));

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Finalize upload failed');
    }
    return response.json();
}


// ── Client Personal Metrics API ───────────────────────────────────────

export interface ClientPersonalData {
    localAccuracy: number;
    datasetSize: number;
    roundsTrained: number;
    lastRoundTime: string;
    modelVersion: string;
    nextScheduled: string;
    curve: number[];
    recentUploads: { name: string; size: string; date: string; rows: number }[];
}

export async function fetchClientPersonal(): Promise<ClientPersonalData> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/client-personal`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable for client-personal");
        return {
            localAccuracy: 0,
            datasetSize: 0,
            roundsTrained: 0,
            lastRoundTime: '0s',
            modelVersion: 'v0.0',
            nextScheduled: '--',
            curve: [],
            recentUploads: [],
        };
    }
}


// ── Security & Fault-Tolerance API ────────────────────────────────────

export async function fetchSecuritySummary(): Promise<SecuritySummary> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/security`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch {
        console.warn("Backend unreachable, returning empty security data");
        return {
            overviewMetrics: [],
            krum: { method: 'krum', threshold: 0, rounds: [] },
            cosineSimilarity: { threshold: 0, rounds: [] },
            rateLimit: { globalLimit: 20, windowSeconds: 60, clients: {}, activeBlocks: 0 },
            ecdsa: { allVerified: true, algorithm: 'ECDSA-secp256k1', clients: {} },
            faultTolerance: { heartbeatIntervalSec: 30, deadThreshold: 3, totalRounds: 0, clients: {}, deadClients: [], healthyCount: 0 },
            recentAttacks: [],
        };
    }
}

export async function fetchAttackTimeline(limit = 50): Promise<AttackEvent[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/security/attacks?limit=${limit}`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        return data.events || [];
    } catch {
        console.warn("Backend unreachable, returning empty attacks");
        return [];
    }
}

export async function fetchFaultTolerance(): Promise<FaultToleranceData> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/security/health`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch {
        console.warn("Backend unreachable, returning empty fault-tolerance");
        return { heartbeatIntervalSec: 30, deadThreshold: 3, totalRounds: 0, clients: {}, deadClients: [], healthyCount: 0 };
    }
}

export async function fetchSelfImprovement(): Promise<SelfImprovementPoint[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/improvement`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch {
        console.warn("Backend unreachable, returning empty self-improvement");
        return [];
    }
}


// ── Schema API ────────────────────────────────────────────────────────

const defaultSchemaFallback: SchemaConfig = {
    fields: [],
    exampleFields: [],
};

export async function fetchSchema(): Promise<SchemaConfig> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/schema`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch {
        console.warn("Backend unreachable, falling back to default schema");
        return defaultSchemaFallback;
    }
}

export async function saveSchema(fields: { name: string; type: string; required: boolean; description: string }[]): Promise<SchemaConfig> {
    const response = await fetch(`${API_BASE_URL}/api/schema`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ fields }),
    });
    if (!response.ok) throw new Error('Save failed');
    return await response.json();
}


// ── Multi-Modal API ───────────────────────────────────────────────────

const defaultMultiModalFallback: MultiModalConfig = {
    fusionMethod: 'late',
    modalities: [],
};

export async function fetchMultiModal(): Promise<MultiModalConfig> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/multimodal`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch {
        console.warn("Backend unreachable, falling back to default multimodal config");
        return defaultMultiModalFallback;
    }
}

export async function saveMultiModal(config: MultiModalConfig): Promise<MultiModalConfig> {
    const response = await fetch(`${API_BASE_URL}/api/multimodal`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Save failed');
    return await response.json();
}


// ── Bots API ──────────────────────────────────────────────────────────

const defaultBotsFallback: BotsConfig = {
    platforms: [],
};

export async function fetchBots(): Promise<BotsConfig> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bots`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch {
        console.warn("Backend unreachable, falling back to default bots config");
        return defaultBotsFallback;
    }
}

export async function toggleBot(platformId: string): Promise<BotsConfig> {
    const response = await fetch(`${API_BASE_URL}/api/bots/toggle`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ platformId }),
    });
    if (!response.ok) throw new Error('Toggle failed');
    return await response.json();
}

export async function testBotCommand(command: string): Promise<{ command: string; response: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bots/test`, {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ command }),
        });
        if (!response.ok) throw new Error('Test failed');
        return await response.json();
    } catch {
        return { command, response: 'Backend unreachable — cannot execute command.' };
    }
}


