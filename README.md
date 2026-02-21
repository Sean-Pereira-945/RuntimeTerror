# RuntimeTerror — Federated Learning Platform

A full-stack privacy-preserving **federated learning** platform that lets heterogeneous client stores (Phone, Clothing, Food) collaboratively train a **DistilBERT sentiment classifier** without sharing raw customer data.

Built for **DevHacks 2026**.

---

## Architecture

```
┌─────────────┐       REST / JWT        ┌──────────────────┐
│  React SPA  │ ◄────────────────────►  │  FastAPI Backend  │
│  (Vite+TS)  │       :5173 → :8000     │   (Python 3.11)   │
└─────────────┘                         └────────┬─────────┘
                                                 │
                      ┌──────────────────────────┼──────────────────────┐
                      │                          │                      │
               ┌──────▼──────┐          ┌────────▼───────┐    ┌────────▼───────┐
               │  Neon        │          │  Flower FL     │    │  DistilBERT    │
               │  PostgreSQL  │          │  Server        │    │  Transformer   │
               │  (cloud)     │          │  (3 clients)   │    │  (PyTorch)     │
               └─────────────┘          └────────────────┘    └────────────────┘
```

## Features

| Area | Details |
|------|---------|
| **Federated Learning** | Flower 1.0 FedAvg with 3 simulated retail clients, variable local epochs |
| **NLP Model** | DistilBERT fine-tuned for binary sentiment classification |
| **Auth** | JWT (HS256, 24 h) + bcrypt password hashing |
| **Database** | PostgreSQL on Neon serverless — auto-migrations on startup |
| **Security** | Multi-Krum aggregation, cosine-similarity filtering, ECDSA signatures, rate limiting |
| **Admin Dashboard** | Real-time global accuracy/loss curves, per-client comparison, training history |
| **Client Dashboard** | Personal accuracy curve, dataset stats from real CSV uploads, model version |
| **Additional Panels** | Fault tolerance, self-improvement viz, dynamic schema, multi-modal config, bot integrations, email training |

## Tech Stack

**Frontend** — React 18 · TypeScript · Vite · Tailwind CSS · Chart.js · Framer Motion

**Backend** — Python · FastAPI · Uvicorn · PyTorch · Transformers (HuggingFace) · Flower · psycopg 3

**Database** — PostgreSQL 17 (Neon serverless)

---

## Project Structure

```
RuntimeTerror/
├── backend/
│   ├── api.py                  # FastAPI app — all REST endpoints
│   ├── app.py                  # Streamlit judge demo (legacy)
│   ├── requirements.txt
│   └── src/
│       ├── auth.py             # JWT + bcrypt authentication
│       ├── database.py         # Neon PostgreSQL connection & migrations
│       ├── features.py         # Schema, multi-modal, bots, email endpoints
│       ├── security.py         # Krum, cosine, ECDSA, rate-limit, fault tolerance
│       ├── nlp_client.py       # Flower federated client logic
│       ├── nlp_data.py         # Synthetic review generation & tokenization
│       ├── transformer_model.py# DistilBERT model wrapper
│       ├── strategy.py         # Custom FedAvg strategy
│       ├── pretrain.py         # Pre-training script
│       ├── inference_api.py    # Standalone inference helpers
│       └── main.py             # FL orchestration (server + clients)
├── frontend/
│   ├── src/
│   │   ├── api.ts              # API client — all fetch functions
│   │   ├── App.tsx             # Router & layout
│   │   ├── pages/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ClientDashboard.tsx
│   │   │   ├── Landing.tsx
│   │   │   └── Login.tsx
│   │   ├── components/
│   │   │   ├── Globe3D.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── charts/        # AccuracyCurve, ClientComparison, SecurityPanel, etc.
│   │   └── context/
│   │       ├── AuthContext.tsx
│   │       └── ThemeContext.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- **Python 3.10+** (Anaconda or venv)
- **Node.js 18+** and npm

### Backend

```bash
cd backend
pip install -r requirements.txt

# Set environment variable (Windows, required for PyTorch)
$env:KMP_DUPLICATE_LIB_OK = "TRUE"

# Start the API server
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

The server runs auto-migrations on startup (creates tables, seeds data, syncs FL metrics from `data/fl_metrics.json` to PostgreSQL).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api` requests to `localhost:8000`.

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string (set in `database.py`) |
| `JWT_SECRET` | Secret key for JWT signing (set in `auth.py`) |
| `KMP_DUPLICATE_LIB_OK` | Set to `TRUE` on Windows to avoid Intel MKL conflicts |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Get JWT token |
| GET | `/api/auth/me` | Bearer | Current user info |
| GET | `/api/metrics` | Bearer | Global accuracy, loss, round labels |
| GET | `/api/clients` | Bearer | Client list + per-client accuracy curves |
| GET | `/api/history` | Bearer | Training round history |
| GET | `/api/client-personal` | Bearer | Personal client metrics, uploads, curve |
| POST | `/api/predict` | Bearer | Run sentiment inference |
| POST | `/api/train` | Bearer | Trigger FL training round |
| POST | `/api/upload` | Bearer | Upload CSV dataset |
| GET | `/api/security` | Bearer | Aggregated security summary |
| GET | `/api/schema` | Bearer | Dynamic schema config |
| GET | `/api/multimodal` | Bearer | Multi-modal fusion config |

## Team

**RuntimeTerror** — DevHacks 2026
