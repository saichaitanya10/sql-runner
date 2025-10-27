from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import time
from typing import Any, Dict, List
import os
import json
import re

# Firebase Admin (optional)
_FIREBASE_READY = False
try:
    import firebase_admin
    from firebase_admin import auth as fb_auth, credentials as fb_credentials
    if not firebase_admin._apps:
        sa_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
        if os.path.exists(sa_path):
            cred = fb_credentials.Certificate(sa_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    _FIREBASE_READY = True
except Exception:
    _FIREBASE_READY = False

DB_PATH = os.path.join(os.path.dirname(__file__), 'sql_runner.db')
ALLOW_UNAUTH = os.getenv('ALLOW_UNAUTH', 'false').lower() == 'true'

app = FastAPI(title="SQL Runner API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "https://sql-runner-hazel.vercel.app",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


class QueryIn(BaseModel):
    query: str


def verify_firebase_token(request: Request) -> Dict[str, Any]:
    """
    Optional auth:
    - If ALLOW_UNAUTH=true, always allow.
    - If Firebase Admin isn't initialized, allow.
    - If Authorization Bearer token is present AND Admin is ready, verify.
    - If no token, allow.
    """
    if ALLOW_UNAUTH:
        return {"dev": True}
    if not _FIREBASE_READY:
        return {"dev": True}
    authz = request.headers.get("Authorization", "")
    if not authz.startswith("Bearer "):
        return {"dev": True}
    token = authz.split(" ", 1)[1].strip()
    try:
        decoded = fb_auth.verify_id_token(token)
        return decoded
    except Exception:
        return {"dev": True}


@app.get("/api/tables")
def list_tables(user: Dict[str, Any] = Depends(verify_firebase_token)):
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT name FROM sqlite_master
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
            """
        )
        tables = [r[0] for r in cur.fetchall()]
        return {"tables": tables}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.get("/api/tables/{name}")
def table_info(name: str, user: Dict[str, Any] = Depends(verify_firebase_token)):
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"PRAGMA table_info({name});")
        cols = cur.fetchall()
        if not cols:
            raise HTTPException(status_code=404, detail=f"Table '{name}' not found")
        columns = [{"name": c[1], "type": c[2]} for c in cols]
        cur.execute(f"SELECT * FROM {name} LIMIT 5;")
        sample_rows = [dict(r) for r in cur.fetchall()]
        return {"columns": columns, "sample": sample_rows}
    except sqlite3.Error as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.post("/api/query")
def execute_query(payload: QueryIn, user: Dict[str, Any] = Depends(verify_firebase_token)):
    q = payload.query.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        conn = get_conn()
        cur = conn.cursor()
        before_changes = conn.total_changes
        started = time.perf_counter()

        def normalize(stmt: str) -> str:
            s = stmt
            # Add IF NOT EXISTS to CREATE TABLE
            if re.match(r"^\s*create\s+table\b", s, flags=re.IGNORECASE) and not re.match(r"^\s*create\s+table\s+if\s+not\s+exists\b", s, flags=re.IGNORECASE):
                s = re.sub(r"^(\s*create\s+table)(\s+)", r"\1 if not exists ", s, flags=re.IGNORECASE)
            # Add IF EXISTS to DROP TABLE
            if re.match(r"^\s*drop\s+table\b", s, flags=re.IGNORECASE) and not re.match(r"^\s*drop\s+table\s+if\s+exists\b", s, flags=re.IGNORECASE):
                s = re.sub(r"^(\s*drop\s+table)(\s+)", r"\1 if exists ", s, flags=re.IGNORECASE)
            
            # Convert MySQL/PostgreSQL syntax to SQLite
            # AUTO_INCREMENT -> AUTOINCREMENT (SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT)
            s = re.sub(r'\bAUTO_INCREMENT\b', 'AUTOINCREMENT', s, flags=re.IGNORECASE)
            
            # Convert INT to INTEGER for primary keys with autoincrement
            s = re.sub(r'\bINT\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b', 'INTEGER PRIMARY KEY AUTOINCREMENT', s, flags=re.IGNORECASE)
            
            # Convert common MySQL types to SQLite equivalents
            s = re.sub(r'\bVARCHAR\s*\(\s*\d+\s*\)', 'TEXT', s, flags=re.IGNORECASE)
            s = re.sub(r'\bCHAR\s*\(\s*\d+\s*\)', 'TEXT', s, flags=re.IGNORECASE)
            s = re.sub(r'\bTINYINT\b', 'INTEGER', s, flags=re.IGNORECASE)
            s = re.sub(r'\bSMALLINT\b', 'INTEGER', s, flags=re.IGNORECASE)
            s = re.sub(r'\bMEDIUMINT\b', 'INTEGER', s, flags=re.IGNORECASE)
            s = re.sub(r'\bBIGINT\b', 'INTEGER', s, flags=re.IGNORECASE)
            s = re.sub(r'\bDOUBLE\b', 'REAL', s, flags=re.IGNORECASE)
            s = re.sub(r'\bFLOAT\b', 'REAL', s, flags=re.IGNORECASE)
            s = re.sub(r'\bDATETIME\b', 'TEXT', s, flags=re.IGNORECASE)
            s = re.sub(r'\bTIMESTAMP\b', 'TEXT', s, flags=re.IGNORECASE)
            
            return s

        # Support multi-statement queries by splitting on ';'
        # Note: This is a simple splitter and may not handle semicolons inside strings.
        # It significantly improves UX for typical usage (DDL+DML+SELECT).
        statements = [s.strip() for s in re.split(r";\s*", q) if s.strip()]

        last_result_rows: List[Dict[str, Any]] = []
        last_result_columns: List[str] = []
        created_table_name: str | None = None

        for i, raw_stmt in enumerate(statements):
            stmt = normalize(raw_stmt)
            is_last = (i == len(statements) - 1)

            # Detect CREATE TABLE tableName ... for schema return later
            m = re.match(r"^\s*create\s+table\s+(?:if\s+not\s+exists\s+)?(?:`|\"|\[)?([A-Za-z_][A-Za-z0-9_]*)", stmt, flags=re.IGNORECASE)
            if m:
                created_table_name = m.group(1)

            # If last is a SELECT, execute it with fetch
            if is_last and re.match(r"^\s*select\b", stmt, flags=re.IGNORECASE):
                cur.execute(stmt)
                if cur.description is not None:
                    last_result_columns = [d[0] for d in cur.description]
                    last_result_rows = [dict(r) for r in cur.fetchall()]
                continue

            # Otherwise, execute without expecting rows
            cur.execute(stmt)

        conn.commit()

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        changed = conn.total_changes - before_changes

        # If last was SELECT with rows
        if last_result_columns:
            return {"columns": last_result_columns, "rows": last_result_rows, "rowCount": len(last_result_rows), "elapsedMs": elapsed_ms}

        # If a CREATE TABLE happened and no SELECT result to show, return the new schema
        if created_table_name:
            try:
                cur.execute(f"PRAGMA table_info({created_table_name});")
                cols = cur.fetchall()
                columns = [c[1] for c in cols]
                return {"columns": columns, "rows": [], "rowCount": 0, "elapsedMs": elapsed_ms}
            except Exception:
                pass

        # Default DDL/DML outcome
        return {"message": "OK", "rowCount": max(0, changed), "elapsedMs": elapsed_ms}
    except sqlite3.Error as e:
        msg = str(e)
        if 'already exists' in msg.lower():
            elapsed_ms = int((time.perf_counter() - started) * 1000) if 'started' in locals() else 0
            return {"message": "OK (table already exists)", "rowCount": 0, "elapsedMs": elapsed_ms}
        raise HTTPException(status_code=400, detail=msg)
    finally:
        try:
            conn.close()
        except Exception:
            pass
