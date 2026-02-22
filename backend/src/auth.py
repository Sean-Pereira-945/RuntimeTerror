"""
Authentication Module — JWT + bcrypt
═════════════════════════════════════
Provides:
  - register / login endpoints (returns JWT)
  - ``get_current_user`` FastAPI dependency for protected routes
  - Role-based access with ``require_role('admin')``
"""

import os
import time
from typing import Optional
from datetime import datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from psycopg.rows import dict_row
from src.database import create_user, get_user_by_email, get_db

# ── Config ────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "fl-devhacks-2026-super-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

bearer_scheme = HTTPBearer(auto_error=False)


# ── Pydantic models ──────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "client"
    org: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict


# ── Password helpers ──────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT helpers ───────────────────────────────────────────────────────

def create_token(user_id: int, email: str, role: str, org: str = "") -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "org": org,
        "exp": time.time() + JWT_EXPIRATION_HOURS * 3600,
        "iat": time.time(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("exp", 0) < time.time():
            raise HTTPException(status_code=401, detail="Token expired")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── FastAPI Dependencies ──────────────────────────────────────────────

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> dict:
    """Extract and validate the JWT from the Authorization header."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user = get_user_by_email(payload["email"])
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "org": payload.get("org") or user.get("org", ""),  # Prefer JWT org, fallback to DB
        "avatar": user.get("avatar", ""),
    }


async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> Optional[dict]:
    """Like get_current_user but returns None instead of 401 when no token."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_role(role: str):
    """Returns a dependency that checks the user has the required role."""
    async def _check(user: dict = Depends(get_current_user)):
        if user["role"] != role:
            raise HTTPException(status_code=403, detail=f"Requires {role} role")
        return user
    return _check


# ── Register / Login logic ────────────────────────────────────────────

def register_user(req: RegisterRequest) -> AuthResponse:
    avatar = "".join(w[0].upper() for w in req.name.split()[:2]) if req.name else "U"
    hashed = hash_password(req.password)

    # Single DB connection: check existence + insert
    with get_db() as conn:
        cur = conn.cursor(row_factory=dict_row)
        cur.execute("SELECT id FROM users WHERE email = %s", (req.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Email already registered")

        cur.execute(
            """INSERT INTO users (email, name, password, role, org, avatar)
               VALUES (%s, %s, %s, %s, %s, %s)
               RETURNING id, email, name, role, org, avatar""",
            (req.email, req.name, hashed, req.role, req.org, avatar),
        )
        user = cur.fetchone()

    if user is None:
        raise HTTPException(status_code=500, detail="Failed to create user")

    token = create_token(user["id"], user["email"], user["role"], user.get("org", ""))
    return AuthResponse(
        token=token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "org": user.get("org", ""),
            "avatar": avatar,
        },
    )


def login_user(req: LoginRequest) -> AuthResponse:
    # Single DB connection: lookup user + verify password
    with get_db() as conn:
        cur = conn.cursor(row_factory=dict_row)
        cur.execute("SELECT * FROM users WHERE email = %s", (req.email,))
        user = cur.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    avatar = user.get("avatar") or "".join(w[0].upper() for w in user["name"].split()[:2])
    token = create_token(user["id"], user["email"], user["role"], user.get("org", ""))
    return AuthResponse(
        token=token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "org": user.get("org", ""),
            "avatar": avatar,
        },
    )
