from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import uvicorn

app = FastAPI()

class HelloResponse(BaseModel):
    message: str
    timestamp: str
    framework: str

class DataItem(BaseModel):
    id: int
    value: float

class DataResponse(BaseModel):
    data: list[DataItem]

class EchoRequest(BaseModel):
    message: str

class EchoResponse(BaseModel):
    echo: EchoRequest
    received: str

@app.get("/api/hello", response_model=HelloResponse)
def hello():
    return HelloResponse(
        message="Hello from Python + FastAPI",
        timestamp=datetime.now().isoformat(),
        framework="FastAPI"
    )

@app.get("/api/data", response_model=DataResponse)
def get_data():
    data = [DataItem(id=i+1, value=float(i)*1.5) for i in range(100)]
    return DataResponse(data=data)

@app.post("/api/echo", response_model=EchoResponse)
def echo(request: EchoRequest):
    return EchoResponse(
        echo=request,
        received=datetime.now().isoformat()
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
