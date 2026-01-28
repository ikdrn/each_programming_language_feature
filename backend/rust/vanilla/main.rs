mod db;

use std::sync::{Arc, Mutex};
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use serde_json::json;
use db::Database;

#[tokio::main]
async fn main() {
    let db = Arc::new(Mutex::new(Database::new(":memory:").unwrap()));
    let listener = TcpListener::bind("127.0.0.1:5001").await.unwrap();

    println!("Rust Vanilla サーバーが起動しました");
    println!("リッスンポート: 5001");

    loop {
        let (socket, _) = listener.accept().await.unwrap();
        let db = db.clone();

        tokio::spawn(async move {
            handle_connection(socket, db).await;
        });
    }
}

async fn handle_connection(mut socket: tokio::net::TcpStream, db: Arc<Mutex<Database>>) {
    let mut buffer = [0; 1024];
    let n = socket.read(&mut buffer).await.unwrap();
    let request = String::from_utf8_lossy(&buffer[..n]);

    let response = if request.starts_with("GET / HTTP") {
        create_response(json!({"message": "Rust Vanilla API", "status": "OK"}))
    } else if request.starts_with("GET /users HTTP") && !request.contains("/users/") {
        let mut db_lock = db.lock().unwrap();
        let users = db_lock.get_all_users().unwrap_or_default();
        create_response(json!({
            "success": true,
            "count": users.len(),
            "data": users,
            "performance": db_lock.get_performance_report()
        }))
    } else if request.starts_with("POST /users HTTP") {
        create_response(json!({"message": "POST /users"}))
    } else {
        create_response(json!({"error": "Not Found"}))
    };

    let _ = socket.write_all(response.as_bytes()).await;
}

fn create_response(body: serde_json::Value) -> String {
    let body_str = body.to_string();
    format!(
        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
        body_str.len(),
        body_str
    )
}
