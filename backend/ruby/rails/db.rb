# Ruby Rails - データベースレイヤー

require 'sqlite3'
require 'json'
require 'time'

class Database
  def initialize(db_path)
    @db = SQLite3::Database.new db_path
    @db.results_as_hash = true
    @operations = []
    create_table
  end

  private def create_table
    @db.execute <<-SQL
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    SQL
  end

  def create_user(name, email, age)
    start = Time.now
    @db.execute('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', [name, email, age])
    id = @db.last_insert_row_id
    duration = (Time.now - start) * 1000
    record_operation('CREATE', duration)

    {
      'id' => id,
      'name' => name,
      'email' => email,
      'age' => age
    }
  end

  def get_user(user_id)
    start = Time.now
    result = @db.execute('SELECT id, name, email, age, created_at, updated_at FROM users WHERE id = ?', [user_id])
    duration = (Time.now - start) * 1000
    record_operation('READ', duration)

    result.empty? ? nil : result[0]
  end

  def get_all_users
    start = Time.now
    users = @db.execute('SELECT id, name, email, age, created_at, updated_at FROM users')
    duration = (Time.now - start) * 1000
    record_operation('READ_ALL', duration)

    users
  end

  def update_user(user_id, name, email, age)
    start = Time.now
    @db.execute('UPDATE users SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, email, age, user_id])
    duration = (Time.now - start) * 1000
    record_operation('UPDATE', duration)

    @db.changes > 0
  end

  def delete_user(user_id)
    start = Time.now
    @db.execute('DELETE FROM users WHERE id = ?', [user_id])
    duration = (Time.now - start) * 1000
    record_operation('DELETE', duration)

    @db.changes > 0
  end

  def benchmark(count = 1000)
    start = Time.now
    @db.transaction do
      stmt = @db.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)')
      count.times do |i|
        stmt.bind_params(["User#{i}", "user#{i}@example.com", 20 + (i % 50)])
        stmt.step
      end
      stmt.close
    end
    duration = (Time.now - start) * 1000
    record_operation('BENCHMARK', duration)
    rps = count / (duration / 1000.0)

    {
      'count' => count,
      'durationMs' => format('%.3f', duration),
      'rps' => format('%.2f', rps)
    }
  end

  private def record_operation(type, duration)
    @operations << {
      'type' => type,
      'duration' => duration,
      'timestamp' => Time.now.to_s
    }
  end

  def get_performance_report
    report = {}

    @operations.each do |op|
      type = op['type']
      duration = op['duration']

      if !report[type]
        report[type] = {
          'count' => 0,
          'totalMs' => 0.0,
          'minMs' => Float::INFINITY,
          'maxMs' => 0.0
        }
      end

      report[type]['count'] += 1
      report[type]['totalMs'] += duration
      report[type]['minMs'] = [report[type]['minMs'], duration].min
      report[type]['maxMs'] = [report[type]['maxMs'], duration].max
    end

    report.each do |key, stats|
      count = stats['count']
      total = stats['totalMs']
      stats['avgMs'] = format('%.3f', total / count)
    end

    report
  end

  def close
    @db.close
  end
end
