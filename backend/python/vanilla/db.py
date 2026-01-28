"""
Python Vanilla - DB層
SQLite接続、CRUD操作、ベンチマーク関数
"""

import sqlite3
import time
from datetime import datetime
from typing import List, Dict, Optional, Any


class Database:
    def __init__(self, db_path: str = ':memory:'):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.operations = []
        self._init_schema()

    def _init_schema(self):
        """テーブル作成"""
        self.conn.execute('''
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
        """ユーザーを作成"""
        start = time.perf_counter()

        cursor = self.conn.cursor()
        cursor.execute(
            'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
            (name, email, age)
        )
        self.conn.commit()

        duration = (time.perf_counter() - start) * 1000
        self._record_operation('CREATE', duration)

        return {
            'id': cursor.lastrowid,
            'name': name,
            'email': email,
            'age': age
        }

    def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        """IDでユーザーを取得"""
        start = time.perf_counter()

        cursor = self.conn.cursor()
        cursor.execute(
            'SELECT id, name, email, age, created_at, updated_at FROM users WHERE id = ?',
            (user_id,)
        )
        row = cursor.fetchone()

        duration = (time.perf_counter() - start) * 1000
        self._record_operation('READ', duration)

        if row:
            return {
                'id': row[0],
                'name': row[1],
                'email': row[2],
                'age': row[3],
                'created_at': row[4],
                'updated_at': row[5]
            }
        return None

    def get_all_users(self) -> List[Dict[str, Any]]:
        """全ユーザーを取得"""
        start = time.perf_counter()

        cursor = self.conn.cursor()
        cursor.execute('SELECT id, name, email, age, created_at, updated_at FROM users')
        rows = cursor.fetchall()

        duration = (time.perf_counter() - start) * 1000
        self._record_operation('READ_ALL', duration)

        return [
            {
                'id': row[0],
                'name': row[1],
                'email': row[2],
                'age': row[3],
                'created_at': row[4],
                'updated_at': row[5]
            }
            for row in rows
        ]

    def update_user(self, user_id: int, name: str, email: str, age: int) -> bool:
        """ユーザーを更新"""
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
        """ユーザーを削除"""
        start = time.perf_counter()

        cursor = self.conn.cursor()
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        self.conn.commit()

        duration = (time.perf_counter() - start) * 1000
        self._record_operation('DELETE', duration)

        return cursor.rowcount > 0

    def benchmark(self, count: int = 1000) -> Dict[str, Any]:
        """1000件の一括INSERT（トランザクション付き）"""
        start = time.perf_counter()

        cursor = self.conn.cursor()
        cursor.execute('BEGIN TRANSACTION')

        for i in range(count):
            cursor.execute(
                'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
                (f'User{i}', f'user{i}@example.com', 20 + (i % 50))
            )

        cursor.execute('COMMIT')
        self.conn.commit()

        duration = (time.perf_counter() - start) * 1000
        self._record_operation('BENCHMARK', duration)

        rps = count / (duration / 1000)

        return {
            'count': count,
            'durationMs': f'{duration:.3f}',
            'rps': f'{rps:.2f}'
        }

    def _record_operation(self, op_type: str, duration: float):
        """操作を記録"""
        self.operations.append({
            'type': op_type,
            'duration': duration,
            'timestamp': datetime.now().isoformat()
        })

    def get_performance_report(self) -> Dict[str, Dict[str, Any]]:
        """パフォーマンスレポート"""
        report = {}

        for op in self.operations:
            op_type = op['type']
            if op_type not in report:
                report[op_type] = {
                    'count': 0,
                    'totalMs': 0,
                    'minMs': float('inf'),
                    'maxMs': 0
                }

            report[op_type]['count'] += 1
            report[op_type]['totalMs'] += op['duration']
            report[op_type]['minMs'] = min(report[op_type]['minMs'], op['duration'])
            report[op_type]['maxMs'] = max(report[op_type]['maxMs'], op['duration'])

        for op_type in report:
            count = report[op_type]['count']
            total = report[op_type]['totalMs']
            report[op_type]['avgMs'] = f'{total / count:.3f}'

        return report

    def close(self):
        """接続を閉じる"""
        self.conn.close()
