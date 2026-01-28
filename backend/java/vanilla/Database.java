import java.sql.*;
import java.util.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class Database {
    private Connection conn;
    private List<Map<String, Object>> operations = new ArrayList<>();

    public Database(String dbPath) throws SQLException {
        String url = "jdbc:sqlite:" + dbPath;
        conn = DriverManager.getConnection(url);
        createTable();
    }

    private void createTable() throws SQLException {
        String sql = """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                age INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """;
        Statement stmt = conn.createStatement();
        stmt.execute(sql);
        stmt.close();
    }

    public Map<String, Object> createUser(String name, String email, int age) throws SQLException {
        long start = System.nanoTime();
        String sql = "INSERT INTO users (name, email, age) VALUES (?, ?, ?)";
        PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
        pstmt.setString(1, name);
        pstmt.setString(2, email);
        pstmt.setInt(3, age);
        pstmt.executeUpdate();

        ResultSet rs = pstmt.getGeneratedKeys();
        long id = rs.getLong(1);
        rs.close();
        pstmt.close();

        double duration = (System.nanoTime() - start) / 1_000_000.0;
        recordOperation("CREATE", duration);

        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("name", name);
        result.put("email", email);
        result.put("age", age);
        return result;
    }

    public Map<String, Object> getUser(long userId) throws SQLException {
        long start = System.nanoTime();
        String sql = "SELECT id, name, email, age, created_at, updated_at FROM users WHERE id = ?";
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setLong(1, userId);
        ResultSet rs = pstmt.executeQuery();

        double duration = (System.nanoTime() - start) / 1_000_000.0;
        recordOperation("READ", duration);

        if (!rs.next()) {
            rs.close();
            pstmt.close();
            return null;
        }

        Map<String, Object> user = new HashMap<>();
        user.put("id", rs.getLong("id"));
        user.put("name", rs.getString("name"));
        user.put("email", rs.getString("email"));
        user.put("age", rs.getInt("age"));
        user.put("created_at", rs.getString("created_at"));
        user.put("updated_at", rs.getString("updated_at"));

        rs.close();
        pstmt.close();
        return user;
    }

    public List<Map<String, Object>> getAllUsers() throws SQLException {
        long start = System.nanoTime();
        String sql = "SELECT id, name, email, age, created_at, updated_at FROM users";
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(sql);

        List<Map<String, Object>> users = new ArrayList<>();
        while (rs.next()) {
            Map<String, Object> user = new HashMap<>();
            user.put("id", rs.getLong("id"));
            user.put("name", rs.getString("name"));
            user.put("email", rs.getString("email"));
            user.put("age", rs.getInt("age"));
            user.put("created_at", rs.getString("created_at"));
            user.put("updated_at", rs.getString("updated_at"));
            users.add(user);
        }

        double duration = (System.nanoTime() - start) / 1_000_000.0;
        recordOperation("READ_ALL", duration);

        rs.close();
        stmt.close();
        return users;
    }

    public boolean updateUser(long userId, String name, String email, int age) throws SQLException {
        long start = System.nanoTime();
        String sql = "UPDATE users SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setString(1, name);
        pstmt.setString(2, email);
        pstmt.setInt(3, age);
        pstmt.setLong(4, userId);
        int rowsAffected = pstmt.executeUpdate();
        pstmt.close();

        double duration = (System.nanoTime() - start) / 1_000_000.0;
        recordOperation("UPDATE", duration);

        return rowsAffected > 0;
    }

    public boolean deleteUser(long userId) throws SQLException {
        long start = System.nanoTime();
        String sql = "DELETE FROM users WHERE id = ?";
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setLong(1, userId);
        int rowsAffected = pstmt.executeUpdate();
        pstmt.close();

        double duration = (System.nanoTime() - start) / 1_000_000.0;
        recordOperation("DELETE", duration);

        return rowsAffected > 0;
    }

    public Map<String, Object> benchmark(int count) throws SQLException {
        long start = System.nanoTime();
        try {
            conn.setAutoCommit(false);
            String sql = "INSERT INTO users (name, email, age) VALUES (?, ?, ?)";
            PreparedStatement pstmt = conn.prepareStatement(sql);
            for (int i = 0; i < count; i++) {
                pstmt.setString(1, "User" + i);
                pstmt.setString(2, "user" + i + "@example.com");
                pstmt.setInt(3, 20 + (i % 50));
                pstmt.addBatch();
            }
            pstmt.executeBatch();
            pstmt.close();
            conn.commit();
        } catch (SQLException e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }

        double duration = (System.nanoTime() - start) / 1_000_000.0;
        recordOperation("BENCHMARK", duration);

        double rps = count / (duration / 1000.0);
        Map<String, Object> result = new HashMap<>();
        result.put("count", count);
        result.put("durationMs", String.format("%.3f", duration));
        result.put("rps", String.format("%.2f", rps));
        return result;
    }

    private void recordOperation(String type, double duration) {
        Map<String, Object> op = new HashMap<>();
        op.put("type", type);
        op.put("duration", duration);
        op.put("timestamp", System.currentTimeMillis());
        operations.add(op);
    }

    public Map<String, Object> getPerformanceReport() {
        Map<String, Object> report = new HashMap<>();

        for (Map<String, Object> op : operations) {
            String type = (String) op.get("type");
            double duration = (double) op.get("duration");

            if (!report.containsKey(type)) {
                Map<String, Object> stats = new HashMap<>();
                stats.put("count", 0);
                stats.put("totalMs", 0.0);
                stats.put("minMs", Double.MAX_VALUE);
                stats.put("maxMs", 0.0);
                report.put(type, stats);
            }

            Map<String, Object> stats = (Map<String, Object>) report.get(type);
            stats.put("count", (int) stats.get("count") + 1);
            stats.put("totalMs", (double) stats.get("totalMs") + duration);
            stats.put("minMs", Math.min((double) stats.get("minMs"), duration));
            stats.put("maxMs", Math.max((double) stats.get("maxMs"), duration));
        }

        for (String key : report.keySet()) {
            Map<String, Object> stats = (Map<String, Object>) report.get(key);
            int count = (int) stats.get("count");
            double total = (double) stats.get("totalMs");
            stats.put("avgMs", String.format("%.3f", total / count));
        }

        return report;
    }

    public void close() throws SQLException {
        conn.close();
    }
}
