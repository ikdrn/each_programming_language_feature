use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::time::Instant;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub age: i32,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone)]
struct Operation {
    op_type: String,
    duration: f64,
    timestamp: String,
}

pub struct Database {
    conn: Connection,
    operations: Vec<Operation>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                age INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        Ok(Database {
            conn,
            operations: Vec::new(),
        })
    }

    pub fn create_user(&mut self, name: &str, email: &str, age: i32) -> Result<User> {
        let start = Instant::now();

        self.conn.execute(
            "INSERT INTO users (name, email, age) VALUES (?1, ?2, ?3)",
            params![name, email, age],
        )?;

        let id = self.conn.last_insert_rowid() as i32;
        let duration = start.elapsed().as_secs_f64() * 1000.0;

        self.record_operation("CREATE", duration);

        Ok(User {
            id,
            name: name.to_string(),
            email: email.to_string(),
            age,
            created_at: chrono::Local::now().to_rfc3339(),
            updated_at: None,
        })
    }

    pub fn get_user(&mut self, id: i32) -> Result<Option<User>> {
        let start = Instant::now();

        let user = self.conn.query_row(
            "SELECT id, name, email, age, created_at, updated_at FROM users WHERE id = ?1",
            params![id],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    email: row.get(2)?,
                    age: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        ).optional()?;

        let duration = start.elapsed().as_secs_f64() * 1000.0;
        self.record_operation("READ", duration);

        Ok(user)
    }

    pub fn get_all_users(&mut self) -> Result<Vec<User>> {
        let start = Instant::now();

        let mut stmt = self.conn.prepare(
            "SELECT id, name, email, age, created_at, updated_at FROM users",
        )?;

        let users = stmt.query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                age: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        let duration = start.elapsed().as_secs_f64() * 1000.0;
        self.record_operation("READ_ALL", duration);

        Ok(users)
    }

    pub fn update_user(&mut self, id: i32, name: &str, email: &str, age: i32) -> Result<bool> {
        let start = Instant::now();

        let rows_affected = self.conn.execute(
            "UPDATE users SET name = ?1, email = ?2, age = ?3, updated_at = CURRENT_TIMESTAMP WHERE id = ?4",
            params![name, email, age, id],
        )?;

        let duration = start.elapsed().as_secs_f64() * 1000.0;
        self.record_operation("UPDATE", duration);

        Ok(rows_affected > 0)
    }

    pub fn delete_user(&mut self, id: i32) -> Result<bool> {
        let start = Instant::now();

        let rows_affected = self.conn.execute(
            "DELETE FROM users WHERE id = ?1",
            params![id],
        )?;

        let duration = start.elapsed().as_secs_f64() * 1000.0;
        self.record_operation("DELETE", duration);

        Ok(rows_affected > 0)
    }

    pub fn benchmark(&mut self, count: usize) -> Result<HashMap<String, serde_json::Value>> {
        let start = Instant::now();

        let tx = self.conn.transaction()?;
        let mut stmt = tx.prepare("INSERT INTO users (name, email, age) VALUES (?1, ?2, ?3)")?;

        for i in 0..count {
            stmt.execute(params![
                format!("User{}", i),
                format!("user{}@example.com", i),
                20 + (i % 50) as i32
            ])?;
        }

        drop(stmt);
        tx.commit()?;

        let duration = start.elapsed().as_secs_f64() * 1000.0;
        self.record_operation("BENCHMARK", duration);

        let rps = count as f64 / (duration / 1000.0);

        let mut result = HashMap::new();
        result.insert("count".to_string(), json!(count));
        result.insert("durationMs".to_string(), json!(format!("{:.3}", duration)));
        result.insert("rps".to_string(), json!(format!("{:.2}", rps)));

        Ok(result)
    }

    fn record_operation(&mut self, op_type: &str, duration: f64) {
        self.operations.push(Operation {
            op_type: op_type.to_string(),
            duration,
            timestamp: chrono::Local::now().to_rfc3339(),
        });
    }

    pub fn get_performance_report(&self) -> HashMap<String, HashMap<String, serde_json::Value>> {
        let mut report: HashMap<String, HashMap<String, serde_json::Value>> = HashMap::new();

        for op in &self.operations {
            let entry = report.entry(op.op_type.clone()).or_insert_with(|| {
                let mut m = HashMap::new();
                m.insert("count".to_string(), json!(0));
                m.insert("totalMs".to_string(), json!(0.0));
                m.insert("minMs".to_string(), json!(f64::INFINITY));
                m.insert("maxMs".to_string(), json!(0.0));
                m
            });

            if let Some(count) = entry.get_mut("count") {
                *count = json!(count.as_i64().unwrap_or(0) + 1);
            }
            if let Some(total) = entry.get_mut("totalMs") {
                *total = json!(total.as_f64().unwrap_or(0.0) + op.duration);
            }
            if let Some(min) = entry.get_mut("minMs") {
                *min = json!(min.as_f64().unwrap_or(f64::INFINITY).min(op.duration));
            }
            if let Some(max) = entry.get_mut("maxMs") {
                *max = json!(max.as_f64().unwrap_or(0.0).max(op.duration));
            }
        }

        for stats in report.values_mut() {
            let count = stats.get("count").and_then(|v| v.as_i64()).unwrap_or(0) as f64;
            let total = stats.get("totalMs").and_then(|v| v.as_f64()).unwrap_or(0.0);
            stats.insert("avgMs".to_string(), json!(format!("{:.3}", total / count)));
        }

        report
    }
}

fn json<T: Into<serde_json::Value>>(val: T) -> serde_json::Value {
    val.into()
}
