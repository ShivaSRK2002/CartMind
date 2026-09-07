from contextlib import contextmanager

import psycopg2
import psycopg2.extras

from .config import DATABASE_URL


@contextmanager
def get_connection():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def fetch_dicts(conn, query: str, params: tuple = ()) -> list[dict]:
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query, params)
        return [dict(row) for row in cur.fetchall()]


def execute(conn, query: str, params: tuple = ()) -> None:
    with conn.cursor() as cur:
        cur.execute(query, params)


def execute_many(conn, query: str, param_sets: list[tuple]) -> None:
    if not param_sets:
        return
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(cur, query, param_sets)
