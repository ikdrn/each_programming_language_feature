"""
Python 言語層 - コア機能
基本的なCRUD操作とパフォーマンス計測を提供
"""

import time
from datetime import datetime
from typing import List, Dict, Optional


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


class User:
    """ユーザーモデル"""

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


class CRUDBase:
    """CRUD操作の基本クラス"""

    def __init__(self):
        self.items: List[User] = []
        self.next_id = 1
        self.operations: List[Dict] = []

    def create(self, name: str, email: str, age: int) -> User:
        """CREATE: ユーザーを作成"""
        timer = PerformanceTimer("CREATE")
        timer.start()

        user = User(self.next_id, name, email, age)
        self.items.append(user)
        self.next_id += 1

        timer.stop()
        self._record_operation("CREATE", timer.get_duration_ms())

        return user

    def read(self, id: int) -> Optional[User]:
        """READ: IDでユーザーを取得"""
        timer = PerformanceTimer("READ")
        timer.start()

        user = next((u for u in self.items if u.id == id), None)

        timer.stop()
        self._record_operation("READ", timer.get_duration_ms())

        return user

    def read_all(self) -> List[User]:
        """READ ALL: 全ユーザーを取得"""
        timer = PerformanceTimer("READ_ALL")
        timer.start()

        users = list(self.items)

        timer.stop()
        self._record_operation("READ_ALL", timer.get_duration_ms())

        return users

    def update(self, id: int, name: str, email: str, age: int) -> Optional[User]:
        """UPDATE: ユーザーを更新"""
        timer = PerformanceTimer("UPDATE")
        timer.start()

        user = next((u for u in self.items if u.id == id), None)
        if user:
            user.name = name
            user.email = email
            user.age = age
            user.updated_at = datetime.now()

        timer.stop()
        self._record_operation("UPDATE", timer.get_duration_ms())

        return user

    def delete(self, id: int) -> bool:
        """DELETE: ユーザーを削除"""
        timer = PerformanceTimer("DELETE")
        timer.start()

        original_len = len(self.items)
        self.items = [u for u in self.items if u.id != id]

        timer.stop()
        self._record_operation("DELETE", timer.get_duration_ms())

        return len(self.items) < original_len

    def _record_operation(self, op_type: str, duration: float):
        """操作を記録"""
        self.operations.append(
            {
                "type": op_type,
                "duration": duration,
                "timestamp": datetime.now().isoformat(),
            }
        )

    def get_performance_report(self) -> Dict:
        """パフォーマンスレポートを取得"""
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

        # 平均を計算
        for op_type in report:
            count = report[op_type]["count"]
            total = report[op_type]["totalMs"]
            report[op_type]["avgMs"] = round(total / count, 3)

        return report
