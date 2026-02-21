"""
PostgreSQL Database Layer  (Neon serverless)
════════════════════════════════════════════
Handles connection pooling, schema migrations, and all CRUD helpers
for auth, FL metrics, feature configs, and email logs.
"""

import os, json, math
from datetime import datetime, timedelta
from contextlib import contextmanager
from typing import Any, Dict, List, Optional

import psycopg
from psycopg.rows import dict_row

# ── Connection string ─────────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_ZjRD8BaUCK5d@ep-sweet-moon-ai22usay-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require",
)

# ── Persistent connection (reuse across requests) ─────────────────────
_conn: psycopg.Connection | None = None


def _get_conn() -> psycopg.Connection:
    """Return a persistent connection, reconnecting only if closed/broken."""
    global _conn
    if _conn is None or _conn.closed:
        _conn = psycopg.connect(DATABASE_URL, row_factory=dict_row, autocommit=False)
    return _conn


@contextmanager
def get_db():
    """Context manager that yields the persistent connection and commits on success."""
    conn = _get_conn()
    try:
        yield conn
        conn.commit()
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise


# ══════════════════════════════════════════════════════════════════════
#  Schema Migrations
# ══════════════════════════════════════════════════════════════════════

MIGRATIONS = [
    # 0 — users table
    """
    CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        email       TEXT UNIQUE NOT NULL,
        name        TEXT NOT NULL,
        password    TEXT NOT NULL,
        role        TEXT NOT NULL DEFAULT 'client'
                    CHECK (role IN ('admin','client')),
        org         TEXT DEFAULT '',
        avatar      TEXT DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    # 1 — fl_metrics (one row per round)
    """
    CREATE TABLE IF NOT EXISTS fl_metrics (
        id              SERIAL PRIMARY KEY,
        round           INT NOT NULL,
        global_accuracy DOUBLE PRECISION NOT NULL,
        loss            DOUBLE PRECISION NOT NULL,
        participants    INT NOT NULL DEFAULT 3,
        duration        TEXT NOT NULL DEFAULT '0s',
        status          TEXT NOT NULL DEFAULT 'completed',
        timestamp       TEXT NOT NULL,
        client_metrics  JSONB DEFAULT '[]',
        created_at      TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    # 2 — generic key-value config store (schema, multimodal, bots, …)
    """
    CREATE TABLE IF NOT EXISTS configs (
        key        TEXT PRIMARY KEY,
        value      JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    # 3 — email logs
    """
    CREATE TABLE IF NOT EXISTS email_logs (
        id         SERIAL PRIMARY KEY,
        sender     TEXT NOT NULL,
        subject    TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('processed','rejected','pending')),
        rows       INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    # 4 — training history cache (optional, for fast history reads)
    """
    CREATE INDEX IF NOT EXISTS idx_fl_metrics_round ON fl_metrics(round);
    """,
    # 5 — attack event log
    """
    CREATE TABLE IF NOT EXISTS attack_events (
        id             SERIAL PRIMARY KEY,
        timestamp      TIMESTAMPTZ DEFAULT NOW(),
        attack_type    TEXT NOT NULL,
        target_client  TEXT NOT NULL,
        severity       TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
        defense_action TEXT NOT NULL,
        blocked        BOOLEAN DEFAULT TRUE,
        details        TEXT DEFAULT '',
        round          INT DEFAULT 0
    );
    """,
    # 6 — ensure round is unique in fl_metrics (de-dup guard)
    """
    DELETE FROM fl_metrics a USING fl_metrics b
    WHERE a.id > b.id AND a.round = b.round;
    """,
    """
    DO $$ BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fl_metrics_round_unique'
        ) THEN
            ALTER TABLE fl_metrics ADD CONSTRAINT fl_metrics_round_unique UNIQUE (round);
        END IF;
    END $$;
    """,
]


def run_migrations():
    """Execute all migrations (idempotent — safe to call every startup)."""
    with get_db() as conn:
        cur = conn.cursor()
        for sql in MIGRATIONS:
            cur.execute(sql)
    print("[DB] Migrations complete.")


# ══════════════════════════════════════════════════════════════════════
#  User helpers (auth)
# ══════════════════════════════════════════════════════════════════════

def create_user(email: str, name: str, hashed_password: str, role: str = "client", org: str = "", avatar: str = "") -> Dict:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO users (email, name, password, role, org, avatar)
               VALUES (%s, %s, %s, %s, %s, %s)
               RETURNING id, email, name, role, org, avatar, created_at""",
            (email, name, hashed_password, role, org, avatar),
        )
        return cur.fetchone()


def get_user_by_email(email: str) -> Optional[Dict]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cur.fetchone()


# ══════════════════════════════════════════════════════════════════════
#  FL Metrics
# ══════════════════════════════════════════════════════════════════════

def save_fl_round(round_data: Dict):
    """Insert a single FL round into the database."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO fl_metrics (round, global_accuracy, loss, participants, duration, status, timestamp, client_metrics)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT DO NOTHING""",
            (
                round_data["round"],
                round_data["globalAccuracy"],
                round_data["loss"],
                round_data.get("participants", 3),
                round_data.get("duration", "0s"),
                round_data.get("status", "completed"),
                round_data.get("timestamp", datetime.now().isoformat()),
                json.dumps(round_data.get("client_metrics", [])),
            ),
        )


def get_all_fl_metrics() -> List[Dict]:
    """Return all FL rounds ordered by round number."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM fl_metrics ORDER BY round ASC")
        rows = cur.fetchall()
        # Normalize to the shape the rest of the app expects
        result = []
        for r in rows:
            result.append({
                "round": r["round"],
                "globalAccuracy": r["global_accuracy"],
                "loss": r["loss"],
                "participants": r["participants"],
                "duration": r["duration"],
                "status": r["status"],
                "timestamp": r["timestamp"],
                "client_metrics": r["client_metrics"] if isinstance(r["client_metrics"], list) else json.loads(r["client_metrics"] or "[]"),
            })
        return result


def sync_json_metrics_to_db():
    """One-time: read existing fl_metrics.json and push rows into Postgres."""
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "fl_metrics.json")
    if not os.path.exists(json_path):
        return
    try:
        with open(json_path, "r") as f:
            history = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return

    if not history:
        return

    with get_db() as conn:
        cur = conn.cursor()
        for h in history:
            cur.execute(
                """INSERT INTO fl_metrics (round, global_accuracy, loss, participants, duration, status, timestamp, client_metrics)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (round) DO NOTHING""",
                (
                    h["round"],
                    h["globalAccuracy"],
                    h["loss"],
                    h.get("participants", 3),
                    h.get("duration", "0s"),
                    h.get("status", "completed"),
                    h.get("timestamp", ""),
                    json.dumps(h.get("client_metrics", [])),
                ),
            )
    print(f"[DB] Synced {len(history)} rounds from fl_metrics.json")


# ══════════════════════════════════════════════════════════════════════
#  Config Store  (schema, multimodal, bots, email_config)
# ══════════════════════════════════════════════════════════════════════

def get_config(key: str) -> Optional[Any]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT value FROM configs WHERE key = %s", (key,))
        row = cur.fetchone()
        return row["value"] if row else None


def set_config(key: str, value: Any):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO configs (key, value, updated_at)
               VALUES (%s, %s, NOW())
               ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()""",
            (key, json.dumps(value)),
        )


# ══════════════════════════════════════════════════════════════════════
#  Email Logs
# ══════════════════════════════════════════════════════════════════════

def get_email_logs(limit: int = 20) -> List[Dict]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM email_logs ORDER BY created_at DESC LIMIT %s", (limit,))
        rows = cur.fetchall()
        return [
            {
                "id": r["id"],
                "from": r["sender"],
                "subject": r["subject"],
                "timestamp": r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"]),
                "status": r["status"],
                "rows": r["rows"],
            }
            for r in rows
        ]


def add_email_log(sender: str, subject: str, status: str = "pending", rows: int = 0) -> Dict:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO email_logs (sender, subject, status, rows)
               VALUES (%s, %s, %s, %s)
               RETURNING id, sender, subject, status, rows, created_at""",
            (sender, subject, status, rows),
        )
        r = cur.fetchone()
        return {
            "id": r["id"],
            "from": r["sender"],
            "subject": r["subject"],
            "timestamp": r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"]),
            "status": r["status"],
            "rows": r["rows"],
        }


# ══════════════════════════════════════════════════════════════════════
#  Attack Events
# ══════════════════════════════════════════════════════════════════════

def save_attack_event(event: Dict):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO attack_events (attack_type, target_client, severity, defense_action, blocked, details, round)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (
                event["attackType"],
                event["targetClient"],
                event["severity"],
                event["defenseAction"],
                event["blocked"],
                event.get("details", ""),
                event.get("round", 0),
            ),
        )


def get_attack_events(limit: int = 50) -> List[Dict]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM attack_events ORDER BY timestamp DESC LIMIT %s", (limit,))
        rows = cur.fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": r["timestamp"].isoformat() if hasattr(r["timestamp"], "isoformat") else str(r["timestamp"]),
                "attackType": r["attack_type"],
                "targetClient": r["target_client"],
                "severity": r["severity"],
                "defenseAction": r["defense_action"],
                "blocked": r["blocked"],
                "details": r["details"],
                "round": r["round"],
            }
            for r in rows
        ]


def seed_initial_data():
    """Seed demo attack events and email logs if tables are empty."""
    with get_db() as conn:
        cur = conn.cursor()

        # Seed attack events
        cur.execute("SELECT COUNT(*) AS cnt FROM attack_events")
        if cur.fetchone()["cnt"] == 0:
            from src.security import attack_timeline
            events = attack_timeline(30)
            for ev in events:
                cur.execute(
                    """INSERT INTO attack_events (attack_type, target_client, severity, defense_action, blocked, details, round, timestamp)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (ev["attackType"], ev["targetClient"], ev["severity"], ev["defenseAction"],
                     ev["blocked"], ev.get("details", ""), ev.get("round", 0), ev["timestamp"]),
                )

        # Seed email logs
        cur.execute("SELECT COUNT(*) AS cnt FROM email_logs")
        if cur.fetchone()["cnt"] == 0:
            now = datetime.now()
            demo_emails = [
                ("alice@metro-general.org", "Patient feedback batch #12", "processed", 320, now - timedelta(minutes=2)),
                ("bob@biotech-inc.com", "Q1 Review data", "processed", 482, now - timedelta(minutes=15)),
                ("unknown@spam.net", "FREE DATA!!!", "rejected", 0, now - timedelta(minutes=22)),
                ("carol@stanford-ml.edu", "Lab experiment results", "processed", 215, now - timedelta(hours=1)),
                ("dave@external.io", "Partnership data share", "pending", 0, now - timedelta(hours=2)),
            ]
            for sender, subj, status, rows, ts in demo_emails:
                cur.execute(
                    """INSERT INTO email_logs (sender, subject, status, rows, created_at)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (sender, subj, status, rows, ts),
                )

    print("[DB] Seed data check complete.")


# ══════════════════════════════════════════════════════════════════════
#  Client Uptimes  (derived from fl_metrics)
# ══════════════════════════════════════════════════════════════════════

def get_client_uptimes_db(history: list | None = None, client_ids: list | None = None) -> Dict[str, float]:
    """Return uptime % per client, derived from actual participation across FL rounds."""
    if history is None:
        history = get_all_fl_metrics()
    total_rounds = len(history)
    if total_rounds == 0:
        return {}

    # Build stable short-name mapping from client_ids
    if client_ids is None:
        seen: dict[str, None] = {}
        for h in history:
            for cm in h.get("client_metrics", []):
                cid = cm.get("client_id", "")
                if cid and cid not in seen:
                    seen[cid] = None
        client_ids = list(seen.keys())

    id_to_short = {cid: f"Client {i+1}" for i, cid in enumerate(client_ids)}

    # Count how many rounds each client actually participated in
    participation: Dict[str, int] = {name: 0 for name in id_to_short.values()}
    for h in history:
        for cm in h.get("client_metrics", []):
            short = id_to_short.get(cm.get("client_id", ""))
            if short:
                participation[short] += 1

    uptimes: Dict[str, float] = {}
    for short, count in participation.items():
        uptimes[short] = round(count / total_rounds * 100, 1)
    return uptimes
