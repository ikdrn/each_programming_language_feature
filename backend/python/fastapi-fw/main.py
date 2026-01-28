"""
Python + FastAPI メイン実行ファイル
uvicorn で起動
"""

from server import app

if __name__ == "__main__":
    import uvicorn

    print("Python + FastAPI サーバーを起動します")
    print("リッスンポート: 3003")
    print("http://localhost:3003")

    uvicorn.run(app, host="0.0.0.0", port=3003)
