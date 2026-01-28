"""
Python + PostgreSQL DB層
トランザクション処理とパフォーマンス計測を含むCRUD操作
"""

import time
from datetime import datetime
from typing import List, Dict, Optional
import threading


class PerformanceTimer:
    """パフォーマンス計測用クラス"""

    def __init__(self, name: str):
        self.name = name
        self.start_time = None
        self.end_time = None

    def start(self):
        """計測開始"""
        self.start_time = time.perf_counter()

    def stop(self):
        """計測停止"""
        self.end_time = time.perf_counter()

    def get_duration_ms(self) -> float:
        """ミリ秒での期間を返す"""
        if self.start_time is None or self.end_time is None:
            return 0
        return (self.end_time - self.start_time) * 1000

    def get_duration_formatted(self) -> str:
        """フォーマット済み期間を返す"""
        return f"{self.get_duration_ms():.3f}ms"


class PostgresRecord:
    """PostgreSQL レコード"""

    def __init__(self, id: int, name: str, email: str, age: int):
        self.id = id
        self.name = name
        self.email = email
        self.age = age
        self.created_at = datetime.now()
        self.updated_at = None

    def to_dict(self) -> Dict:
        """辞書に変換"""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "age": self.age,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class PostgresCRUD:
    """PostgreSQL CRUD操作クラス"""

    def __init__(self):
        self.data: List[PostgresRecord] = []
        self.next_id = 1
        self.operations: List[Dict] = []
        self.transactions: List[Dict] = []
        self.tx_counter = 0
        self.lock = threading.RLock()

    def transaction(self, callback):
        """トランザクション処理"""
        with self.lock:
            self.tx_counter += 1
            tx_id = self.tx_counter
            timer = PerformanceTimer("TRANSACTION")
            timer.start()

            print(f"[PostgreSQL] トランザクション開始: {tx_id}")

            try:
                result = callback()

                print(f"[PostgreSQL] トランザクションコミット: {tx_id}")

                timer.stop()
                self.transactions.append(
                    {
                        "id": tx_id,
                        "status": "COMMIT",
                        "duration": timer.get_duration_ms(),
                    }
                )

                return result

            except Exception as e:
                print(
                    f"[PostgreSQL] トランザクションロールバック: {tx_id} - {str(e)}"
                )

                timer.stop()
                self.transactions.append(
                    {
                        "id": tx_id,
                        "status": "ROLLBACK",
                        "duration": timer.get_duration_ms(),
                    }
                )

                raise

    def insert(self, name: str, email: str, age: int) -> PostgresRecord:
        """INSERT処理"""
        def _insert():
            timer = PerformanceTimer("INSERT")
            timer.start()

            record = PostgresRecord(self.next_id, name, email, age)
            self.data.append(record)
            self.next_id += 1

            timer.stop()
            self.operations.append(
                {
                    "type": "INSERT",
                    "duration": timer.get_duration_ms(),
                    "timestamp": datetime.now().isoformat(),
                }
            )

            print(
                f"[PostgreSQL] INSERT完了 - ID: {record.id}, 所要時間: {timer.get_duration_formatted()}"
            )
            return record

        return self.transaction(_insert)

    def select(self, id: int) -> Optional[PostgresRecord]:
        """SELECT処理（1件）"""
        timer = PerformanceTimer("SELECT")
        timer.start()

        record = next((r for r in self.data if r.id == id), None)

        timer.stop()
        self.operations.append(
            {
                "type": "SELECT",
                "duration": timer.get_duration_ms(),
                "timestamp": datetime.now().isoformat(),
            }
        )

        if record:
            print(
                f"[PostgreSQL] SELECT完了 - ID: {id}, 所要時間: {timer.get_duration_formatted()}"
            )

        return record

    def select_all(self) -> List[PostgresRecord]:
        """SELECT ALL処理"""
        timer = PerformanceTimer("SELECT_ALL")
        timer.start()

        records = list(self.data)

        timer.stop()
        self.operations.append(
            {
                "type": "SELECT_ALL",
                "duration": timer.get_duration_ms(),
                "timestamp": datetime.now().isoformat(),
            }
        )

        print(
            f"[PostgreSQL] SELECT_ALL完了 - 件数: {len(records)}, 所要時間: {timer.get_duration_formatted()}"
        )

        return records

    def update(self, id: int, name: str, email: str, age: int) -> Optional[PostgresRecord]:
        """UPDATE処理"""
        def _update():
            timer = PerformanceTimer("UPDATE")
            timer.start()

            record = next((r for r in self.data if r.id == id), None)
            if record:
                record.name = name
                record.email = email
                record.age = age
                record.updated_at = datetime.now()

                timer.stop()
                self.operations.append(
                    {
                        "type": "UPDATE",
                        "duration": timer.get_duration_ms(),
                        "timestamp": datetime.now().isoformat(),
                    }
                )

                print(
                    f"[PostgreSQL] UPDATE完了 - ID: {id}, 所要時間: {timer.get_duration_formatted()}"
                )
            else:
                timer.stop()
                raise ValueError(f"レコードが見つかりません: ID={id}")

            return record

        return self.transaction(_update)

    def delete(self, id: int) -> bool:
        """DELETE処理"""
        def _delete():
            timer = PerformanceTimer("DELETE")
            timer.start()

            original_len = len(self.data)
            self.data = [r for r in self.data if r.id != id]

            if len(self.data) < original_len:
                timer.stop()
                self.operations.append(
                    {
                        "type": "DELETE",
                        "duration": timer.get_duration_ms(),
                        "timestamp": datetime.now().isoformat(),
                    }
                )

                print(
                    f"[PostgreSQL] DELETE完了 - ID: {id}, 所要時間: {timer.get_duration_formatted()}"
                )
                return True
            else:
                timer.stop()
                raise ValueError(f"レコードが見つかりません: ID={id}")

        return self.transaction(_delete)

    def batch_insert(self, records: List[Dict]) -> List[PostgresRecord]:
        """バッチ挿入処理"""
        def _batch_insert():
            timer = PerformanceTimer("BATCH_INSERT")
            timer.start()

            results = []
            for rec in records:
                record = PostgresRecord(
                    self.next_id, rec["name"], rec["email"], rec["age"]
                )
                self.data.append(record)
                results.append(record)
                self.next_id += 1

            timer.stop()
            self.operations.append(
                {
                    "type": "BATCH_INSERT",
                    "duration": timer.get_duration_ms(),
                    "timestamp": datetime.now().isoformat(),
                }
            )

            print(
                f"[PostgreSQL] BATCH_INSERT完了 - 件数: {len(records)}, 所要時間: {timer.get_duration_formatted()}"
            )
            return results

        return self.transaction(_batch_insert)

    def get_performance_report(self) -> Dict:
        """パフォーマンスレポート取得"""
        report = {}

        for op in self.operations:
            op_type = op["type"]
            if op_type not in report:
                report[op_type] = {
                    "count": 0,
                    "totalMs": 0,
                    "minMs": float("inf"),
                    "maxMs": 0,
                }

            report[op_type]["count"] += 1
            report[op_type]["totalMs"] += op["duration"]
            report[op_type]["minMs"] = min(report[op_type]["minMs"], op["duration"])
            report[op_type]["maxMs"] = max(report[op_type]["maxMs"], op["duration"])

        for op_type in report:
            count = report[op_type]["count"]
            total = report[op_type]["totalMs"]
            report[op_type]["avgMs"] = round(total / count, 3)

        return report

    def get_transaction_report(self) -> Dict:
        """トランザクションレポート取得"""
        committed = sum(1 for t in self.transactions if t["status"] == "COMMIT")
        rolledback = sum(1 for t in self.transactions if t["status"] == "ROLLBACK")

        return {
            "totalTransactions": len(self.transactions),
            "committedTransactions": committed,
            "rolledBackTransactions": rolledback,
            "transactions": self.transactions,
        }
