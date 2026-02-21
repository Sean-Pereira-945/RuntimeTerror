import { adminMetrics, clients, clientAccuracyCurves, accuracyOverRounds, lossOverRounds, roundLabels, trainingHistory } from './data/mockData';

const API_BASE_URL = 'http://localhost:8000';

export async function fetchMetrics() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/metrics`);
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable, falling back to mockData");
        return {
            accuracyOverRounds,
            adminMetrics,
            lossOverRounds,
            roundLabels
        };
    }
}

export async function fetchClients() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/clients`);
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable, falling back to mockData");
        return {
            clients,
            clientAccuracyCurves
        };
    }
}

export async function fetchHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/history`);
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable, falling back to mockData");
        return {
            trainingHistory
        };
    }
}

export async function predictSentiment(text: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
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
    try {
        const response = await fetch(`${API_BASE_URL}/api/train`, {
            method: "POST"
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable for training");
        throw error;
    }
}

export async function uploadClientData(clientId: string, file: File) {
    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        return await response.json();
    } catch (error) {
        console.warn("Backend unreachable for upload");
        throw error;
    }
}
