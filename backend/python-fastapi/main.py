"""
Python + FastAPI API サーバー
ベンチマーク用の基本的なRESTful APIエンドポイントを実装
FastAPI は最新の非同期フレームワークで、自動的なSwagger UI生成が特徴
"""

from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import uvicorn

# FastAPI アプリケーションインスタンスを作成
app = FastAPI()

# グリーティングメッセージのレスポンスモデル
class HelloResponse(BaseModel):
    message: str
    timestamp: str
    framework: str

# サンプルデータアイテムのモデル
class DataItem(BaseModel):
    id: int
    value: float

# サンプルデータのレスポンスモデル
class DataResponse(BaseModel):
    data: list[DataItem]

# エコーエンドポイントのリクエストモデル
class EchoRequest(BaseModel):
    message: str

# エコーエンドポイントのレスポンスモデル
class EchoResponse(BaseModel):
    echo: EchoRequest
    received: str

# GET /api/hello - グリーティングメッセージを返す
@app.get("/api/hello", response_model=HelloResponse)
def hello():
    """グリーティングメッセージエンドポイント"""
    return HelloResponse(
        message="Hello from Python + FastAPI",
        timestamp=datetime.now().isoformat(),
        framework="FastAPI"
    )

# GET /api/data - 100個のサンプルデータを返す
@app.get("/api/data", response_model=DataResponse)
def get_data():
    """サンプルデータを返すエンドポイント"""
    # リスト内包表記で100個のデータアイテムを生成
    data = [DataItem(id=i+1, value=float(i)*1.5) for i in range(100)]
    return DataResponse(data=data)

# POST /api/echo - リクエストボディをエコーバックする
@app.post("/api/echo", response_model=EchoResponse)
def echo(request: EchoRequest):
    """ポストされたデータをエコーバックするエンドポイント"""
    return EchoResponse(
        echo=request,
        received=datetime.now().isoformat()
    )

# メイン処理: uvicorn サーバーを起動
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
