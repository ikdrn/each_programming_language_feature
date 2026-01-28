import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.sql.SQLException;

@SpringBootApplication
public class Application {
    private static Database db;

    public static void main(String[] args) {
        try {
            db = new Database(":memory:");
        } catch (SQLException e) {
            e.printStackTrace();
        }
        SpringApplication.run(Application.class, args);
        System.out.println("Java Spring Boot サーバーが起動しました");
        System.out.println("リッスンポート: 8002");
    }

    public static Database getDb() {
        return db;
    }
}

@RestController
class ApiController {
    @GetMapping("/")
    public Map<String, Object> health() {
        return Map.of("message", "Java Spring Boot", "status", "OK");
    }

    @GetMapping("/users")
    public Map<String, Object> getAllUsers() throws SQLException {
        List<Map<String, Object>> users = ApiController.getDb().getAllUsers();
        return Map.of(
            "success", true,
            "count", users.size(),
            "data", users,
            "performance", ApiController.getDb().getPerformanceReport()
        );
    }

    @PostMapping("/users")
    public Map<String, Object> createUser(@RequestBody Map<String, Object> body) throws SQLException {
        Map<String, Object> result = ApiController.getDb().createUser(
            (String) body.get("name"),
            (String) body.get("email"),
            ((Number) body.get("age")).intValue()
        );
        return Map.of(
            "success", true,
            "data", result,
            "performance", ApiController.getDb().getPerformanceReport()
        );
    }

    @GetMapping("/users/{id}")
    public Map<String, Object> getUser(@PathVariable long id) throws SQLException {
        Map<String, Object> user = ApiController.getDb().getUser(id);
        return Map.of(
            "success", user != null,
            "data", user,
            "performance", ApiController.getDb().getPerformanceReport()
        );
    }

    @PutMapping("/users/{id}")
    public Map<String, Object> updateUser(@PathVariable long id, @RequestBody Map<String, Object> body) throws SQLException {
        boolean updated = ApiController.getDb().updateUser(
            id,
            (String) body.get("name"),
            (String) body.get("email"),
            ((Number) body.get("age")).intValue()
        );
        return Map.of(
            "success", updated,
            "performance", ApiController.getDb().getPerformanceReport()
        );
    }

    @DeleteMapping("/users/{id}")
    public Map<String, Object> deleteUser(@PathVariable long id) throws SQLException {
        boolean deleted = ApiController.getDb().deleteUser(id);
        return Map.of(
            "success", deleted,
            "performance", ApiController.getDb().getPerformanceReport()
        );
    }

    @PostMapping("/benchmark")
    public Map<String, Object> benchmark(@RequestBody(required = false) Map<String, Object> body) throws SQLException {
        int count = body != null && body.containsKey("count") ?
            ((Number) body.get("count")).intValue() : 1000;

        Map<String, Object> result = ApiController.getDb().benchmark(count);
        return Map.of(
            "success", true,
            "benchmark", result,
            "performance", ApiController.getDb().getPerformanceReport()
        );
    }

    private static Database getDb() throws SQLException {
        return Application.getDb();
    }
}
