import sqlite3
import os
from contextlib import contextmanager
from pathlib import Path
from ..config import Config

SCHEMA_PATH = Path(__file__).resolve().parent.parent.parent.parent / "database" / "schema.sql"

def get_db_connection():
    """Returns a connection to the SQLite database with Row factory enabled."""
    conn = sqlite3.connect(Config.DATABASE_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def db_cursor(commit=False):
    """Context manager for obtaining a database cursor with automatic commit/rollback."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        if commit:
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def query_db(query, args=(), one=False):
    """Convenience helper to query the database and return dictionaries."""
    with db_cursor() as cur:
        cur.execute(query, args)
        rows = cur.fetchall()
        result = [dict(row) for row in rows]
        return (result[0] if result else None) if one else result

def execute_db(query, args=(), return_id=False):
    """Convenience helper to execute insert/update/delete operations."""
    with db_cursor(commit=True) as cur:
        cur.execute(query, args)
        if return_id:
            return cur.lastrowid
        return cur.rowcount

def init_db():
    """Initializes tables from schema.sql if not present."""
    Config.init_folders()
    if not os.path.exists(SCHEMA_PATH):
        # Fallback inline schema path if root directory differs
        local_schema = Path(__file__).resolve().parent.parent.parent / "database" / "schema.sql"
        schema_file = local_schema if local_schema.exists() else SCHEMA_PATH
    else:
        schema_file = SCHEMA_PATH
        
    with open(schema_file, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
        
    conn = get_db_connection()
    try:
        conn.executescript(schema_sql)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(employees)")
        cols = [row[1] for row in cursor.fetchall()]
        if 'location' not in cols and len(cols) > 0:
            cursor.execute("ALTER TABLE employees ADD COLUMN location VARCHAR(100) DEFAULT 'Bengaluru'")
        conn.commit()
    finally:
        conn.close()
