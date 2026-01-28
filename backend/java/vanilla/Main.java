import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.util.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonElement;

public class Main {
    private static Database db;
    private static Gson gson = new Gson();

    public static void main(String[] args) throws Exception {
        db = new Database(":memory:");

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 8001), 0);

        server.createContext("/", exchange -> {
            if ("GET".equals(exchange.getRequestMethod())) {
                sendJson(exchange, 200, Map.of("message", "Java Vanilla", "status", "OK"));
            } else {
                sendJson(exchange, 404, Map.of("error", "Not Found"));
            }
        });

        server.createContext("/users", exchange -> {
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            if ("GET".equals(method) && "/users".equals(path)) {
                List<Map<String, Object>> users = db.getAllUsers();
                Map<String, Object> response = Map.of(
                    "success", true,
                    "count", users.size(),
                    "data", users,
                    "performance", db.getPerformanceReport()
                );
                sendJson(exchange, 200, response);
            } else if ("POST".equals(method) && "/users".equals(path)) {
                String body = new String(exchange.getRequestBody().readAllBytes());
                JsonObject json = gson.fromJson(body, JsonObject.class);
                Map<String, Object> result = db.createUser(
                    json.get("name").getAsString(),
                    json.get("email").getAsString(),
                    json.get("age").getAsInt()
                );
                Map<String, Object> response = Map.of(
                    "success", true,
                    "data", result,
                    "performance", db.getPerformanceReport()
                );
                sendJson(exchange, 201, response);
            }
        });

        server.createContext("/users/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            String[] parts = path.split("/");
            if (parts.length < 3) return;

            try {
                long userId = Long.parseLong(parts[2]);
                String method = exchange.getRequestMethod();

                if ("GET".equals(method)) {
                    Map<String, Object> user = db.getUser(userId);
                    Map<String, Object> response = Map.of(
                        "success", user != null,
                        "data", user,
                        "performance", db.getPerformanceReport()
                    );
                    sendJson(exchange, 200, response);
                } else if ("PUT".equals(method)) {
                    String body = new String(exchange.getRequestBody().readAllBytes());
                    JsonObject json = gson.fromJson(body, JsonObject.class);
                    boolean updated = db.updateUser(
                        userId,
                        json.get("name").getAsString(),
                        json.get("email").getAsString(),
                        json.get("age").getAsInt()
                    );
                    Map<String, Object> response = Map.of(
                        "success", updated,
                        "performance", db.getPerformanceReport()
                    );
                    sendJson(exchange, 200, response);
                } else if ("DELETE".equals(method)) {
                    boolean deleted = db.deleteUser(userId);
                    Map<String, Object> response = Map.of(
                        "success", deleted,
                        "performance", db.getPerformanceReport()
                    );
                    sendJson(exchange, 200, response);
                }
            } catch (Exception e) {
                sendJson(exchange, 500, Map.of("error", e.getMessage()));
            }
        });

        server.createContext("/benchmark", exchange -> {
            if ("POST".equals(exchange.getRequestMethod())) {
                try {
                    String body = new String(exchange.getRequestBody().readAllBytes());
                    JsonObject json = gson.fromJson(body, JsonObject.class);
                    int count = json.has("count") ? json.get("count").getAsInt() : 1000;

                    Map<String, Object> result = db.benchmark(count);
                    Map<String, Object> response = Map.of(
                        "success", true,
                        "benchmark", result,
                        "performance", db.getPerformanceReport()
                    );
                    sendJson(exchange, 200, response);
                } catch (Exception e) {
                    sendJson(exchange, 500, Map.of("error", e.getMessage()));
                }
            }
        });

        server.setExecutor(null);
        server.start();

        System.out.println("Java Vanilla サーバーが起動しました");
        System.out.println("リッスンポート: 8001");
    }

    private static void sendJson(HttpExchange exchange, int statusCode, Object data) throws IOException {
        String json = gson.toJson(data);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, json.length());
        OutputStream os = exchange.getResponseBody();
        os.write(json.getBytes());
        os.close();
    }
}
