from fastapi import FastAPI, BackgroundTasks, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import json
from datetime import datetime

from src.inference_api import predict_sentiment
from src.security import (
    security_summary,
    fault_tolerance_status,
    krum_scores,
    cosine_similarity_matrix,
    rate_limit_status,
    ecdsa_status,
)
from src.auth import (
    RegisterRequest,
    LoginRequest,
    register_user,
    login_user,
    get_current_user,
    get_optional_user,
    require_role,
)
from src.database import (
    run_migrations,
    sync_json_metrics_to_db,
    seed_initial_data,
    get_all_fl_metrics,
    save_fl_round,
    get_config,
    set_config,
    get_email_logs,
    add_email_log,
    get_attack_events,
    save_attack_event,
    get_client_uptimes_db,
)
from src.features import (
    get_self_improvement,
    bot_test_command,
)

app = FastAPI(title="FL Server API")

# Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    text: str

# ── Startup: run DB migrations & seed data ────────────────────────────

@app.on_event("startup")
def on_startup():
    run_migrations()
    sync_json_metrics_to_db()
    seed_initial_data()


# ══════════════════════════════════════════════════════════════════════
#  Auth endpoints  (public)
# ══════════════════════════════════════════════════════════════════════

@app.post("/api/auth/register")
def api_register(req: RegisterRequest):
    return register_user(req)

@app.post("/api/auth/login")
def api_login(req: LoginRequest):
    return login_user(req)

@app.get("/api/auth/me")
def api_me(user: dict = Depends(get_current_user)):
    return {"user": user}


# ══════════════════════════════════════════════════════════════════════
#  Core FL endpoints  (DB-backed)
# ══════════════════════════════════════════════════════════════════════

def _get_history():
    """Return FL metrics from the database."""
    return get_all_fl_metrics()


@app.get("/api/metrics")
def get_metrics(user: dict = Depends(get_current_user)):
    history = _get_history()
    if not history:
        return {
            "accuracyOverRounds": [],
            "lossOverRounds": [],
            "roundLabels": [],
            "adminMetrics": [
                {"id": "accuracy", "label": "Global Model Accuracy", "value": 0, "suffix": "%", "trend": 0, "trendLabel": "", "icon": "accuracy", "color": "from-blue-500 to-cyan-400"},
                {"id": "clients", "label": "Active Clients", "value": 0, "suffix": "/3", "trend": 0, "trendLabel": "", "icon": "clients", "color": "from-violet-500 to-purple-400"},
                {"id": "rounds", "label": "Training Rounds", "value": 0, "suffix": "", "trend": 0, "trendLabel": "", "icon": "rounds", "color": "from-pink-500 to-rose-400"},
                {"id": "convergence", "label": "Avg Convergence", "value": 0, "suffix": "s", "trend": 0, "trendLabel": "", "icon": "convergence", "color": "from-amber-500 to-orange-400"},
            ],
        }

    acc_over_rounds = [round(h["globalAccuracy"] * 100, 1) for h in history]
    loss_over_rounds = [round(h["loss"], 4) for h in history]
    round_labels = [f"R{h['round']}" for h in history]
    latest = history[-1]
    prev = history[-2] if len(history) > 1 else latest

    accuracy = latest["globalAccuracy"] * 100
    acc_trend = accuracy - (prev["globalAccuracy"] * 100)
    rounds_count = latest["round"]

    return {
        "accuracyOverRounds": acc_over_rounds,
        "lossOverRounds": loss_over_rounds,
        "roundLabels": round_labels,
        "adminMetrics": [
            {"id": "accuracy", "label": "Global Model Accuracy", "value": round(accuracy, 1), "suffix": "%", "trend": round(acc_trend, 1), "trendLabel": "vs last round", "icon": "accuracy", "color": "from-blue-500 to-cyan-400"},
            {"id": "clients", "label": "Active Clients", "value": latest["participants"], "suffix": "/3", "trend": 0, "trendLabel": "all connected", "icon": "clients", "color": "from-violet-500 to-purple-400"},
            {"id": "rounds", "label": "Training Rounds", "value": rounds_count, "suffix": "", "trend": rounds_count - prev["round"] if rounds_count > prev.get("round", 0) else 0, "trendLabel": "this session", "icon": "rounds", "color": "from-pink-500 to-rose-400"},
            {"id": "convergence", "label": "Avg Round Time", "value": round(sum(float(h["duration"].rstrip("s")) for h in history) / len(history), 1) if history else 0, "suffix": "s", "trend": round(float(latest["duration"].rstrip("s")) - float(prev["duration"].rstrip("s")), 1) if len(history) > 1 else 0, "trendLabel": "vs last round", "icon": "convergence", "color": "from-amber-500 to-orange-400"},
        ],
    }


@app.get("/api/clients")
def get_clients(user: dict = Depends(get_current_user)):
    history = _get_history()
    clients_def = {
        "0": {"id": "client-a", "name": "Phone Store A", "shortName": "Phone", "dataPoints": 200, "color": "#3b82f6", "contribution": 34.2},
        "1": {"id": "client-b", "name": "Clothing Store B", "shortName": "Clothing", "dataPoints": 200, "color": "#8b5cf6", "contribution": 33.3},
        "2": {"id": "client-c", "name": "Food Store C", "shortName": "Food", "dataPoints": 200, "color": "#ec4899", "contribution": 32.5},
    }

    client_curves: dict[str, list] = {"Phone": [], "Clothing": [], "Food": []}
    rounds_count = len(history)

    # Map client_metrics by position index (0→Phone, 1→Clothing, 2→Food)
    # since actual FL training uses random UUIDs as client_id
    index_to_short = {0: "Phone", 1: "Clothing", 2: "Food"}

    for h in history:
        cm_list = h.get("client_metrics", [])
        for idx, cm in enumerate(cm_list):
            short_name = index_to_short.get(idx)
            if short_name:
                client_curves[short_name].append(round(cm.get("accuracy", 0.0) * 100, 1))

    clients_res = []
    uptimes = get_client_uptimes_db()
    for cid, c in clients_def.items():
        base = c.copy()
        base["roundsParticipated"] = rounds_count
        base["status"] = "active"
        base["lastActive"] = "1 min ago"
        short_name = c["shortName"]
        base["localAccuracy"] = client_curves[short_name][-1] if client_curves[short_name] else 0.0
        base["uptime"] = uptimes.get(short_name, 99.0)
        clients_res.append(base)

    return {"clients": clients_res, "clientAccuracyCurves": client_curves}


@app.get("/api/history")
def get_history_endpoint(user: dict = Depends(get_current_user)):
    history = _get_history()
    formatted = []
    for h in reversed(history):
        formatted.append({
            "round": h["round"],
            "timestamp": h["timestamp"],
            "globalAccuracy": round(h["globalAccuracy"] * 100, 1),
            "loss": round(h["loss"], 2),
            "participants": h["participants"],
            "duration": h["duration"],
            "status": h["status"],
        })
    return {"trainingHistory": formatted}


@app.get("/api/client-personal")
def get_client_personal(user: dict = Depends(get_current_user)):
    """Return personal metrics for the currently-logged-in client."""
    history = _get_history()
    rounds_count = len(history)
    latest = history[-1] if history else None

    # Determine which store this user belongs to
    user_org = user.get("org", "")
    store_name = "Phone"
    if "Clothing" in user_org or "BioTech" in user_org:
        store_name = "Clothing"
    elif "Food" in user_org or "Stanford" in user_org:
        store_name = "Food"

    # Build per-client accuracy curve (by index: 0→Phone, 1→Clothing, 2→Food)
    store_idx = {"Phone": 0, "Clothing": 1, "Food": 2}[store_name]
    client_curve: list[float] = []
    for h in history:
        cm_list = h.get("client_metrics", [])
        if store_idx < len(cm_list):
            client_curve.append(round(cm_list[store_idx].get("accuracy", 0.0) * 100, 1))

    local_accuracy = client_curve[-1] if client_curve else 0.0
    model_version = f"v{rounds_count}.{len(client_curve)}" if rounds_count else "v0.0"
    last_round_time = latest["duration"] if latest else "0s"

    # Compute dataset size from actual upload file
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "uploads")
    dataset_size = 0
    recent_uploads: list[dict] = []
    if os.path.isdir(upload_dir):
        import pandas as pd
        for fname in sorted(os.listdir(upload_dir), reverse=True):
            fpath = os.path.join(upload_dir, fname)
            if os.path.isfile(fpath):
                stat = os.stat(fpath)
                size_str = f"{stat.st_size / 1024:.0f} KB" if stat.st_size < 1_048_576 else f"{stat.st_size / 1_048_576:.1f} MB"
                rows = 0
                if fname.endswith(".csv"):
                    for enc in ("utf-8", "utf-16", "latin-1"):
                        try:
                            df = pd.read_csv(fpath, encoding=enc)
                            rows = len(df)
                            break
                        except Exception:
                            continue
                dataset_size += rows
                recent_uploads.append({
                    "name": fname,
                    "size": size_str,
                    "date": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d"),
                    "rows": rows,
                })

    return {
        "localAccuracy": local_accuracy,
        "datasetSize": dataset_size,
        "roundsTrained": len(client_curve),
        "lastRoundTime": last_round_time,
        "modelVersion": model_version,
        "nextScheduled": "~4 min",
        "curve": client_curve,
        "recentUploads": recent_uploads,
    }


@app.post("/api/predict")
def predict(req: PredictRequest, user: dict = Depends(get_current_user)):
    return predict_sentiment(req.text)


def run_fl_background():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    try:
        subprocess.run(["python", "-m", "src.main"], check=True, cwd=backend_dir)
    except subprocess.CalledProcessError as e:
        print(f"Simulation failed: {e}")


@app.post("/api/train")
def train(background_tasks: BackgroundTasks, admin: dict = Depends(require_role("admin"))):
    background_tasks.add_task(run_fl_background)
    return {"status": "Training started in background"}


@app.post("/api/upload")
async def upload_file(client_id: str = Form(...), file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    import shutil
    import pandas as pd
    import tempfile

    upload_dir = os.path.join(os.path.dirname(__file__), "data", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Try common encodings to handle files with BOM or non-UTF-8 encoding
        for enc in ("utf-8-sig", "utf-8", "utf-16", "latin-1"):
            try:
                df = pd.read_csv(tmp_path, encoding=enc)
                break
            except (UnicodeDecodeError, UnicodeError):
                continue
        else:
            os.unlink(tmp_path)
            raise HTTPException(status_code=400, detail="Could not decode CSV file. Please save it as UTF-8.")

        if "text" not in df.columns or "label" not in df.columns:
            os.unlink(tmp_path)
            raise HTTPException(status_code=400, detail=f"CSV must have 'text' and 'label' columns. Found: {list(df.columns)}")

        if not df["label"].isin([0, 1]).all():
            os.unlink(tmp_path)
            raise HTTPException(status_code=400, detail="'label' column must contain only 0 (negative) or 1 (positive)")

        file_path = os.path.join(upload_dir, f"{client_id}.csv")
        # Re-save as UTF-8 so downstream code never has encoding issues
        df.to_csv(file_path, index=False, encoding="utf-8")
        os.unlink(tmp_path)

    except pd.errors.ParserError:
        os.unlink(tmp_path)
        raise HTTPException(status_code=400, detail="File is not a valid CSV")

    return {"filename": file.filename, "client_id": client_id, "rows": len(df), "status": "success"}


# ══════════════════════════════════════════════════════════════════════
#  Security & Fault-Tolerance endpoints (authenticated)
# ══════════════════════════════════════════════════════════════════════

@app.get("/api/security")
def get_security(user: dict = Depends(get_current_user)):
    return security_summary()


@app.get("/api/security/attacks")
def get_attacks(limit: int = 50, user: dict = Depends(get_current_user)):
    """Return attack events from the database."""
    events = get_attack_events(limit)
    return {"events": events}


@app.get("/api/security/health")
def get_health(user: dict = Depends(get_current_user)):
    return fault_tolerance_status()


@app.get("/api/security/krum")
def get_krum(round: int | None = None, user: dict = Depends(get_current_user)):
    return krum_scores(round)


@app.get("/api/security/cosine")
def get_cosine(round: int | None = None, user: dict = Depends(get_current_user)):
    return cosine_similarity_matrix(round)


@app.get("/api/security/ratelimit")
def get_ratelimit(user: dict = Depends(get_current_user)):
    return rate_limit_status()


@app.get("/api/security/ecdsa")
def get_ecdsa(user: dict = Depends(get_current_user)):
    return ecdsa_status()


# ══════════════════════════════════════════════════════════════════════
#  Feature endpoints — DB-backed via configs table
# ══════════════════════════════════════════════════════════════════════

# ── Request models ────────────────────────────────────────────────────

class SchemaRequest(BaseModel):
    fields: list

class MultiModalRequest(BaseModel):
    fusionMethod: str
    modalities: list

class BotToggleRequest(BaseModel):
    platformId: str

class BotTestRequest(BaseModel):
    command: str

class EmailConfigRequest(BaseModel):
    enabled: bool
    address: str
    provider: str
    format: str

class EmailTestRequest(BaseModel):
    recipient: str


# ── Defaults (used when DB has no entry yet) ──────────────────────────

DEFAULT_SCHEMA = {
    "fields": [
        {"name": "text",  "type": "text",   "required": True,  "description": "Review text content"},
        {"name": "label", "type": "number", "required": True,  "description": "Sentiment label (0/1)"},
    ],
    "exampleFields": [
        {"name": "rating",   "type": "number",   "required": False, "description": "Star rating (1-5)"},
        {"name": "category", "type": "category", "required": False, "description": "Product category"},
        {"name": "verified", "type": "boolean",  "required": False, "description": "Verified purchase"},
    ],
}

DEFAULT_MULTIMODAL = {
    "fusionMethod": "late",
    "modalities": [
        {"id": "text",  "label": "Text (NLP)",    "icon": "FiFileText", "enabled": True,  "weight": 0.60, "description": "DistilBERT sentiment embeddings", "color": "#8b5cf6"},
        {"id": "image", "label": "Image (Vision)", "icon": "FiImage",    "enabled": False, "weight": 0.25, "description": "ResNet-18 product image features", "color": "#06b6d4"},
        {"id": "audio", "label": "Audio (Speech)", "icon": "FiMic",      "enabled": False, "weight": 0.15, "description": "Wav2Vec2 voice review embeddings", "color": "#f59e0b"},
    ],
}

DEFAULT_BOTS = {
    "platforms": [
        {"id": "telegram", "name": "Telegram", "icon": "plane", "color": "#0088cc", "connected": True, "webhook": "https://api.telegram.org/bot****/webhook", "commands": ["/train", "/status", "/predict <text>", "/metrics", "/upload"]},
        {"id": "whatsapp", "name": "WhatsApp", "icon": "chat", "color": "#25D366", "connected": False, "webhook": "https://graph.facebook.com/v18.0/****/messages", "commands": ["!train", "!status", "!predict <text>", "!metrics"]},
        {"id": "discord",  "name": "Discord",  "icon": "game", "color": "#5865F2", "connected": False, "webhook": "https://discord.com/api/webhooks/****/****", "commands": ["/fl-train", "/fl-status", "/fl-predict", "/fl-metrics"]},
    ]
}

DEFAULT_EMAIL_CONFIG = {
    "enabled": True,
    "address": "train@fedlearn.devhacks2026.app",
    "provider": "SendGrid",
    "format": "csv_attachment",
}


# ── Schema ────────────────────────────────────────────────────────────

@app.get("/api/schema")
def api_get_schema(user: dict = Depends(get_current_user)):
    stored = get_config("schema")
    return stored if stored else DEFAULT_SCHEMA

@app.post("/api/schema")
def api_save_schema(req: SchemaRequest, admin: dict = Depends(require_role("admin"))):
    cfg = get_config("schema") or DEFAULT_SCHEMA.copy()
    cfg["fields"] = req.fields
    set_config("schema", cfg)
    return cfg


# ── Multi-Modal ───────────────────────────────────────────────────────

@app.get("/api/multimodal")
def api_get_multimodal(user: dict = Depends(get_current_user)):
    stored = get_config("multimodal")
    return stored if stored else DEFAULT_MULTIMODAL

@app.post("/api/multimodal")
def api_save_multimodal(req: MultiModalRequest, admin: dict = Depends(require_role("admin"))):
    cfg = {"fusionMethod": req.fusionMethod, "modalities": req.modalities}
    set_config("multimodal", cfg)
    return cfg


# ── Bots ──────────────────────────────────────────────────────────────

@app.get("/api/bots")
def api_get_bots(user: dict = Depends(get_current_user)):
    stored = get_config("bots")
    return stored if stored else DEFAULT_BOTS

@app.post("/api/bots/toggle")
def api_toggle_bot(req: BotToggleRequest, admin: dict = Depends(require_role("admin"))):
    cfg = get_config("bots") or DEFAULT_BOTS.copy()
    for p in cfg["platforms"]:
        if p["id"] == req.platformId:
            p["connected"] = not p["connected"]
            break
    set_config("bots", cfg)
    return cfg

@app.post("/api/bots/test")
def api_bot_test(req: BotTestRequest, user: dict = Depends(get_current_user)):
    return bot_test_command(req.command)


# ── Email ─────────────────────────────────────────────────────────────

@app.get("/api/email")
def api_get_email(user: dict = Depends(get_current_user)):
    config = get_config("email_config") or DEFAULT_EMAIL_CONFIG
    logs = get_email_logs()
    return {"config": config, "logs": logs}

@app.post("/api/email/config")
def api_save_email_config(req: EmailConfigRequest, admin: dict = Depends(require_role("admin"))):
    cfg = {"enabled": req.enabled, "address": req.address, "provider": req.provider, "format": req.format}
    set_config("email_config", cfg)
    logs = get_email_logs()
    return {"config": cfg, "logs": logs}

@app.post("/api/email/test")
def api_email_test(req: EmailTestRequest, user: dict = Depends(get_current_user)):
    log_entry = add_email_log(sender=req.recipient, subject="Test CSV — pipeline validation", status="processed", rows=50)
    return {"message": f"Test email sent to {req.recipient}", "log": log_entry}


# ── Self-Improvement ──────────────────────────────────────────────────

@app.get("/api/improvement")
def api_get_improvement(user: dict = Depends(get_current_user)):
    return get_self_improvement()
