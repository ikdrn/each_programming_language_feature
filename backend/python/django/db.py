"""
Python Django - データベースレイヤー
"""

import sqlite3
from typing import List, Dict, Optional, Any
from datetime import datetime
import time


class Database:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.operations: List[Dict[str, Any]] = []
        self._create_table()

    def _create_table(self):
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                age INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.conn.commit()

    def create_user(self, name: str, email: str, age: int) -> Dict[str, Any]:
        start = time.perf_counter()
        cursor = self.conn.cursor()
        cursor.execute(
            'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
            (name, email, age)
        )
        self.conn.commit()
        user_id = cursor.lastrowid
        duration = (time.perf_counter() - start) * 1000
        self._record_operation('CREATE', duration)
        return {
            'id': user_id,
            'name': name,
            'email': email,
            'age': age
        }

    def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        start = time.perf_counter()
        cursor = self.conn.cursor()
        cursor.execute(
            'SELECT id, name, email, age, created_at, updated_at FROM users WHERE id = ?',
            (user_id,)
        )
        row = cursor.fetchone()
        duration = (time.perf_counter() - start) * 1000
        self._record_operation('READ', duration)
        if row is None:
            return None
        return dict(row)

    def get_all_users(self) -> List[Dict[str, Any]]:
        start = time.perf_counter()
        cursor = self.conn.cursor()
        cursor.execute(
            'SELECT id, name, email, age, created_at, updated_at FROM users'
        )
        rows = cursor.fetchall()
        duration = (time.perf_counter() - start) * 1000
        self._record_operation('READ_ALL', duration)
        return [dict(row) for row in rows]

    def update_user(self, user_id: int, name: str, email: str, age: int) -> bool:
        start = time.perf_counter()
        cursor = self.conn.cursor()
        cursor.execute(
            'UPDATE users SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            (name, email, age, user_id)
        )
        self.conn.commit()
        duration = (time.perf_counter() - start) * 1000
        self._record_operation('UPDATE', duration)
        return cursor.rowcount > 0

    def delete_user(self, user_id: int) -> bool:
        start = time.perf_counter()
        cursor = self.conn.cursor()
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        self.conn.commit()
        duration = (time.perf_counter() - start) * 1000
        self._record_operation('DELETE', duration)
        return cursor.rowcount > 0

    def benchmark(self, count: int = 1000) -> Dict[str, Any]:
        start = time.perf_counter()
        cursor = self.conn.cursor()
        try:
            self.conn.execute('BEGIN TRANSACTION')
            for i in range(count):
                cursor.execute(
                    'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
                    (f'User{i}', f'user{i}@example.com', 20 + (i % 50))
                )
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            raise e
        duration = (time.perf_counter() - start) * 1000
        self._record_operation('BENCHMARK', duration)
        rps = count / (duration / 1000)
        return {
            'count': count,
            'durationMs': f'{duration:.3f}',
            'rps': f'{rps:.2f}'
        }

    def _record_operation(self, op_type: str, duration: float):
        self.operations.append({
            'type': op_type,
            'duration': duration,
            'timestamp': datetime.now()
        })

    def get_performance_report(self) -> Dict[str, Dict[str, Any]]:
        report: Dict[str, Dict[str, Any]] = {}
        for op in self.operations:
            op_type = op['type']
            duration = op['duration']
            if op_type not in report:
                report[op_type] = {
                    'count': 0,
                    'totalMs': 0.0,
                    'minMs': float('inf'),
                    'maxMs': 0.0
                }
            report[op_type]['count'] += 1
            report[op_type]['totalMs'] += duration
            report[op_type]['minMs'] = min(report[op_type]['minMs'], duration)
            report[op_type]['maxMs'] = max(report[op_type]['maxMs'], duration)

        for key in report:
            stats = report[key]
            count = stats['count']
            total = stats['totalMs']
            stats['avgMs'] = f'{total / count:.3f}'

        return report

    def close(self):
        self.conn.close()
