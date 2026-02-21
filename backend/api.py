from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os

from src.inference_api import predict_sentiment

app = FastAPI(title="FL Server API")

# Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    text: str

# Mock data imports or definitions to match frontend `mockData.ts` structures
@app.get("/api/metrics")
def get_metrics():
    # Return metrics mimicking `adminMetrics` and charting data in `mockData.ts`
    return {
        "accuracyOverRounds": [
            58.3, 61.7, 64.2, 66.8, 69.1, 71.5, 73.2, 74.8, 76.1, 77.4,
            78.6, 79.5, 80.3, 81.1, 81.8, 82.4, 83.0, 83.5, 84.0, 84.5,
            85.0, 85.4, 85.8, 86.2, 86.6, 87.0, 87.4, 87.8, 88.2, 88.6,
            89.0, 89.3, 89.6, 89.9, 90.2, 90.5, 90.8, 91.1, 91.4, 91.7,
            92.0, 92.3, 92.6, 92.9, 93.3, 93.7, 94.2,
        ],
        "adminMetrics": [
            { "id": 'accuracy', "label": 'Global Model Accuracy', "value": 94.2, "suffix": '%', "trend": 2.1, "trendLabel": 'vs last round', "icon": 'accuracy', "color": 'from-blue-500 to-cyan-400' },
            { "id": 'clients', "label": 'Active Clients', "value": 3, "suffix": '/3', "trend": 0, "trendLabel": 'all connected', "icon": 'clients', "color": 'from-violet-500 to-purple-400' },
            { "id": 'rounds', "label": 'Training Rounds', "value": 47, "suffix": '', "trend": 4.3, "trendLabel": 'this session', "icon": 'rounds', "color": 'from-pink-500 to-rose-400' },
            { "id": 'convergence', "label": 'Avg Convergence', "value": 2.3, "suffix": 's', "trend": -12.5, "trendLabel": 'faster than avg', "icon": 'convergence', "color": 'from-amber-500 to-orange-400' }
        ]
    }

@app.get("/api/clients")
def get_clients():
    return {
        "clients": [
            { "id": 'client-a', "name": 'Hospital A — Metro General', "shortName": 'Hospital A', "dataPoints": 12450, "localAccuracy": 92.8, "roundsParticipated": 47, "status": 'active', "lastActive": '2 min ago', "color": '#3b82f6', "contribution": 34.2 },
            { "id": 'client-b', "name": 'Research Lab B — BioTech Inc', "shortName": 'Lab B', "dataPoints": 8320, "localAccuracy": 91.5, "roundsParticipated": 45, "status": 'active', "lastActive": '5 min ago', "color": '#8b5cf6', "contribution": 28.7 },
            { "id": 'client-c', "name": 'University C — Stanford ML', "shortName": 'Univ C', "dataPoints": 15780, "localAccuracy": 93.1, "roundsParticipated": 47, "status": 'active', "lastActive": '1 min ago', "color": '#ec4899', "contribution": 37.1 },
        ],
        "clientAccuracyCurves": {
            "Hospital A": [ 57.1, 60.2, 63.5, 66.0, 68.3, 70.7, 72.5, 74.1, 75.4, 76.8, 78.0, 79.0, 79.8, 80.6, 81.3, 81.9, 82.5, 83.0, 83.5, 84.0, 84.4, 84.8, 85.2, 85.6, 86.0, 86.4, 86.8, 87.2, 87.6, 88.0, 88.3, 88.6, 88.9, 89.2, 89.5, 89.8, 90.1, 90.4, 90.7, 91.0, 91.3, 91.6, 91.9, 92.1, 92.4, 92.6, 92.8 ],
            "Lab B": [ 55.8, 59.1, 62.3, 64.9, 67.1, 69.5, 71.2, 72.8, 74.1, 75.3, 76.5, 77.4, 78.2, 79.0, 79.7, 80.3, 80.9, 81.4, 81.9, 82.4, 82.8, 83.2, 83.6, 84.0, 84.4, 84.8, 85.2, 85.6, 86.0, 86.3, 86.6, 86.9, 87.2, 87.5, 87.8, 88.1, 88.4, 88.7, 89.0, 89.3, 89.6, 89.9, 90.2, 90.5, 90.9, 91.2, 91.5 ],
            "Univ C": [ 59.2, 62.5, 65.1, 67.5, 69.8, 72.2, 73.9, 75.5, 76.8, 78.1, 79.3, 80.2, 81.0, 81.8, 82.5, 83.1, 83.7, 84.2, 84.7, 85.2, 85.6, 86.0, 86.4, 86.8, 87.2, 87.6, 88.0, 88.4, 88.8, 89.1, 89.4, 89.7, 90.0, 90.3, 90.6, 90.9, 91.2, 91.5, 91.8, 92.1, 92.4, 92.7, 93.0, 93.3, 93.6, 93.9, 93.1 ]
        }
    }

@app.get("/api/history")
def get_history():
    return {
        "trainingHistory": [
            { "round": 47, "timestamp": '2026-02-21 14:32:18', "globalAccuracy": 94.2, "loss": 0.26, "participants": 3, "duration": '2.3s', "status": 'completed' },
            { "round": 46, "timestamp": '2026-02-21 14:28:45', "globalAccuracy": 93.7, "loss": 0.27, "participants": 3, "duration": '2.1s', "status": 'completed' },
            { "round": 45, "timestamp": '2026-02-21 14:24:12', "globalAccuracy": 93.3, "loss": 0.28, "participants": 3, "duration": '2.4s', "status": 'completed' }
        ]
    }

@app.post("/api/predict")
def predict(req: PredictRequest):
    result = predict_sentiment(req.text)
    return result

def run_fl_background():
    try:
        subprocess.run(["python", "-m", "src.main"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Simulation failed: {e}")
        
    with open("global_model.pth", "w") as f:
        f.write("simulation_complete")

@app.post("/api/train")
def train(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_fl_background)
    return {"status": "Training started in background"}
