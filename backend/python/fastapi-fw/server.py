"""
Python + FastAPI フレームワーク層
REST APIエンドポイント実装
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import sys

sys.path.append("../db")
from postgres import PostgresCRUD


# Pydantic モデル
class UserCreate(BaseModel):
    """ユーザー作成リクエスト"""
    name: str
    email: str
    age: int


class UserUpdate(BaseModel):
    """ユーザー更新リクエスト"""
    name: str
    email: str
    age: int


class BatchInsertRequest(BaseModel):
    """バッチ挿入リクエスト"""
    records: List[Dict]


# FastAPI アプリケーション
app = FastAPI()

# DB インスタンス
pg_db = PostgresCRUD()


# =============================================
# PostgreSQL エンドポイント
# =============================================

@app.post("/postgres/insert")
async def postgres_insert(user: UserCreate):
    """PostgreSQL - INSERT処理"""
    try:
        record = pg_db.insert(user.name, user.email, user.age)

        return {
            "success": True,
            "message": "PostgreSQL - INSERT成功",
            "data": record.to_dict(),
            "performance": pg_db.get_performance_report(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/postgres/select/{id}")
async def postgres_select(id: int):
    """PostgreSQL - SELECT処理"""
    try:
        record = pg_db.select(id)

        return {
            "success": True,
            "message": "PostgreSQL - SELECT成功",
            "data": record.to_dict() if record else None,
            "performance": pg_db.get_performance_report(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/postgres/selectall")
async def postgres_selectall():
    """PostgreSQL - SELECT ALL処理"""
    try:
        records = pg_db.select_all()

        return {
            "success": True,
            "message": "PostgreSQL - SELECT ALL成功",
            "count": len(records),
            "data": [r.to_dict() for r in records],
            "performance": pg_db.get_performance_report(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/postgres/update/{id}")
async def postgres_update(id: int, user: UserUpdate):
    """PostgreSQL - UPDATE処理"""
    try:
        record = pg_db.update(id, user.name, user.email, user.age)

        if not record:
            raise HTTPException(status_code=404, detail="レコードが見つかりません")

        return {
            "success": True,
            "message": "PostgreSQL - UPDATE成功",
            "data": record.to_dict(),
            "performance": pg_db.get_performance_report(),
            "transactions": pg_db.get_transaction_report(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/postgres/delete/{id}")
async def postgres_delete(id: int):
    """PostgreSQL - DELETE処理"""
    try:
        deleted = pg_db.delete(id)

        if not deleted:
            raise HTTPException(status_code=404, detail="レコードが見つかりません")

        return {
            "success": True,
            "message": "PostgreSQL - DELETE成功",
            "deleted": True,
            "performance": pg_db.get_performance_report(),
            "transactions": pg_db.get_transaction_report(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/postgres/batch-insert")
async def postgres_batch_insert(request: BatchInsertRequest):
    """PostgreSQL - BATCH INSERT処理"""
    try:
        records = pg_db.batch_insert(request.records)

        return {
            "success": True,
            "message": "PostgreSQL - BATCH INSERT成功",
            "count": len(records),
            "data": [r.to_dict() for r in records],
            "performance": pg_db.get_performance_report(),
            "transactions": pg_db.get_transaction_report(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# ヘルスチェック
# =============================================

@app.get("/")
async def health_check():
    """ヘルスチェック"""
    return {
        "message": "Python + FastAPI Server",
        "status": "OK",
    }
