mod db;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put, delete},
    Json, Router,
};
use std::sync::{Arc, Mutex};
use db::{Database, User};
use serde::{Deserialize, Serialize};

#[derive(Clone)]
struct AppState {
    db: Arc<Mutex<Database>>,
}

#[derive(Serialize, Deserialize)]
struct UserRequest {
    name: String,
    email: String,
    age: i32,
}

#[derive(Serialize, Deserialize)]
struct BenchmarkRequest {
    count: Option<usize>,
}

#[tokio::main]
async fn main() {
    let state = AppState {
        db: Arc::new(Mutex::new(Database::new(":memory:").unwrap())),
    };

    let app = Router::new()
        .route("/", get(health))
        .route("/users", post(create_user).get(get_all_users))
        .route("/users/:id", get(get_user).put(update_user).delete(delete_user))
        .route("/benchmark", post(benchmark))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:5002")
        .await
        .unwrap();

    println!("Rust Axum サーバーが起動しました");
    println!("リッスンポート: 5002");

    axum::serve(listener, app).await.unwrap();
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "message": "Rust Axum API",
        "status": "OK"
    }))
}

async fn create_user(
    State(state): State<AppState>,
    Json(req): Json<UserRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let mut db = state.db.lock().unwrap();
    match db.create_user(&req.name, &req.email, req.age) {
        Ok(user) => (
            StatusCode::CREATED,
            Json(serde_json::json!({
                "success": true,
                "data": user,
                "performance": db.get_performance_report()
            })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        ),
    }
}

async fn get_all_users(State(state): State<AppState>) -> Json<serde_json::Value> {
    let mut db = state.db.lock().unwrap();
    match db.get_all_users() {
        Ok(users) => Json(serde_json::json!({
            "success": true,
            "count": users.len(),
            "data": users,
            "performance": db.get_performance_report()
        })),
        Err(e) => Json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn get_user(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Json<serde_json::Value> {
    let mut db = state.db.lock().unwrap();
    match db.get_user(id) {
        Ok(user) => Json(serde_json::json!({
            "success": user.is_some(),
            "data": user,
            "performance": db.get_performance_report()
        })),
        Err(e) => Json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn update_user(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(req): Json<UserRequest>,
) -> Json<serde_json::Value> {
    let mut db = state.db.lock().unwrap();
    match db.update_user(id, &req.name, &req.email, req.age) {
        Ok(success) => Json(serde_json::json!({
            "success": success,
            "performance": db.get_performance_report()
        })),
        Err(e) => Json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn delete_user(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Json<serde_json::Value> {
    let mut db = state.db.lock().unwrap();
    match db.delete_user(id) {
        Ok(success) => Json(serde_json::json!({
            "success": success,
            "performance": db.get_performance_report()
        })),
        Err(e) => Json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn benchmark(
    State(state): State<AppState>,
    Json(req): Json<BenchmarkRequest>,
) -> Json<serde_json::Value> {
    let count = req.count.unwrap_or(1000);
    let mut db = state.db.lock().unwrap();
    match db.benchmark(count) {
        Ok(result) => Json(serde_json::json!({
            "success": true,
            "benchmark": result,
            "performance": db.get_performance_report()
        })),
        Err(e) => Json(serde_json::json!({"error": e.to_string()})),
    }
}
