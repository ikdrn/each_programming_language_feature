mod db;

use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use std::sync::Mutex;
use db::{Database, User};
use serde::{Deserialize, Serialize};

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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db = web::Data::new(Mutex::new(Database::new(":memory:").unwrap()));

    println!("Rust Actix-web サーバーが起動しました");
    println!("リッスンポート: 5003");

    HttpServer::new(move || {
        App::new()
            .app_data(db.clone())
            .route("/", web::get().to(health))
            .route("/users", web::post().to(create_user).get(get_all_users))
            .route("/users/{id}", web::get().to(get_user).put(update_user).delete(delete_user))
            .route("/benchmark", web::post().to(benchmark))
    })
    .bind("127.0.0.1:5003")?
    .run()
    .await
}

async fn health() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Rust Actix-web API",
        "status": "OK"
    }))
}

async fn create_user(
    db: web::Data<Mutex<Database>>,
    req: web::Json<UserRequest>,
) -> impl Responder {
    let mut db = db.lock().unwrap();
    match db.create_user(&req.name, &req.email, req.age) {
        Ok(user) => HttpResponse::Created().json(serde_json::json!({
            "success": true,
            "data": user,
            "performance": db.get_performance_report()
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

async fn get_all_users(db: web::Data<Mutex<Database>>) -> impl Responder {
    let mut db = db.lock().unwrap();
    match db.get_all_users() {
        Ok(users) => HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "count": users.len(),
            "data": users,
            "performance": db.get_performance_report()
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

async fn get_user(db: web::Data<Mutex<Database>>, id: web::Path<i32>) -> impl Responder {
    let mut db = db.lock().unwrap();
    match db.get_user(id.into_inner()) {
        Ok(user) => HttpResponse::Ok().json(serde_json::json!({
            "success": user.is_some(),
            "data": user,
            "performance": db.get_performance_report()
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

async fn update_user(
    db: web::Data<Mutex<Database>>,
    id: web::Path<i32>,
    req: web::Json<UserRequest>,
) -> impl Responder {
    let mut db = db.lock().unwrap();
    match db.update_user(id.into_inner(), &req.name, &req.email, req.age) {
        Ok(success) => HttpResponse::Ok().json(serde_json::json!({
            "success": success,
            "performance": db.get_performance_report()
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

async fn delete_user(db: web::Data<Mutex<Database>>, id: web::Path<i32>) -> impl Responder {
    let mut db = db.lock().unwrap();
    match db.delete_user(id.into_inner()) {
        Ok(success) => HttpResponse::Ok().json(serde_json::json!({
            "success": success,
            "performance": db.get_performance_report()
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

async fn benchmark(
    db: web::Data<Mutex<Database>>,
    req: web::Json<BenchmarkRequest>,
) -> impl Responder {
    let count = req.count.unwrap_or(1000);
    let mut db = db.lock().unwrap();
    match db.benchmark(count) {
        Ok(result) => HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "benchmark": result,
            "performance": db.get_performance_report()
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}
