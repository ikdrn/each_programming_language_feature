"""
Python FastAPI - メインファイル（ルーティングのみ）
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db import Database
import uvicorn

app = FastAPI()
db = Database(':memory:')


class UserRequest(BaseModel):
    name: str
    email: str
    age: int


class BenchmarkRequest(BaseModel):
    count: Optional[int] = 1000


@app.get('/')
async def health():
    return {'message': 'Python FastAPI', 'status': 'OK'}


@app.post('/users')
async def create_user(user: UserRequest):
    try:
        result = db.create_user(user.name, user.email, user.age)
        return {
            'success': True,
            'data': result,
            'performance': db.get_performance_report()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/users')
async def get_all_users():
    try:
        users = db.get_all_users()
        return {
            'success': True,
            'count': len(users),
            'data': users,
            'performance': db.get_performance_report()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/users/{user_id}')
async def get_user(user_id: int):
    try:
        user = db.get_user(user_id)
        return {
            'success': user is not None,
            'data': user,
            'performance': db.get_performance_report()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put('/users/{user_id}')
async def update_user(user_id: int, user: UserRequest):
    try:
        updated = db.update_user(user_id, user.name, user.email, user.age)
        return {
            'success': updated,
            'performance': db.get_performance_report()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete('/users/{user_id}')
async def delete_user(user_id: int):
    try:
        deleted = db.delete_user(user_id)
        return {
            'success': deleted,
            'performance': db.get_performance_report()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/benchmark')
async def benchmark(req: BenchmarkRequest):
    try:
        result = db.benchmark(req.count)
        return {
            'success': True,
            'benchmark': result,
            'performance': db.get_performance_report()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    print('Python FastAPI サーバーが起動しました')
    print('リッスンポート: 6002')
    uvicorn.run(app, host='127.0.0.1', port=6002)
