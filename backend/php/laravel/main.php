<?php
/**
 * PHP Laravel - メインファイル（ルーティングのみ）
 */

require_once 'db.php';

class Route {
    private static $routes = [];

    public static function get($path, $callback) {
        self::$routes[] = ['method' => 'GET', 'path' => $path, 'callback' => $callback];
    }

    public static function post($path, $callback) {
        self::$routes[] = ['method' => 'POST', 'path' => $path, 'callback' => $callback];
    }

    public static function put($path, $callback) {
        self::$routes[] = ['method' => 'PUT', 'path' => $path, 'callback' => $callback];
    }

    public static function delete($path, $callback) {
        self::$routes[] = ['method' => 'DELETE', 'path' => $path, 'callback' => $callback];
    }

    public static function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        foreach (self::$routes as $route) {
            $pattern = preg_replace('/{(\w+)}/', '(?P<$1>\d+)', $route['path']);
            $pattern = '@^' . $pattern . '$@';

            if ($route['method'] === $method && preg_match($pattern, $path, $matches)) {
                $params = array_filter($matches, fn($k) => !is_numeric($k), ARRAY_FILTER_USE_KEY);
                return call_user_func_array($route['callback'], $params);
            }
        }

        return json_response(['error' => 'Not Found'], 404);
    }
}

function json_response($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function get_json_body() {
    return json_decode(file_get_contents('php://input'), true);
}

$db = new Database(':memory:');

// Routes
Route::get('/', function() {
    json_response(['message' => 'PHP Laravel', 'status' => 'OK']);
});

Route::get('/users', function() {
    global $db;
    $users = $db->getAllUsers();
    json_response([
        'success' => true,
        'count' => count($users),
        'data' => $users,
        'performance' => $db->getPerformanceReport()
    ]);
});

Route::post('/users', function() {
    global $db;
    $body = get_json_body();
    $result = $db->createUser($body['name'], $body['email'], $body['age']);
    json_response([
        'success' => true,
        'data' => $result,
        'performance' => $db->getPerformanceReport()
    ], 201);
});

Route::get('/users/{id}', function($id) {
    global $db;
    $user = $db->getUser($id);
    json_response([
        'success' => $user !== null,
        'data' => $user,
        'performance' => $db->getPerformanceReport()
    ]);
});

Route::put('/users/{id}', function($id) {
    global $db;
    $body = get_json_body();
    $updated = $db->updateUser($id, $body['name'], $body['email'], $body['age']);
    json_response([
        'success' => $updated,
        'performance' => $db->getPerformanceReport()
    ]);
});

Route::delete('/users/{id}', function($id) {
    global $db;
    $deleted = $db->deleteUser($id);
    json_response([
        'success' => $deleted,
        'performance' => $db->getPerformanceReport()
    ]);
});

Route::post('/benchmark', function() {
    global $db;
    $body = get_json_body();
    $count = $body['count'] ?? 1000;
    $result = $db->benchmark($count);
    json_response([
        'success' => true,
        'benchmark' => $result,
        'performance' => $db->getPerformanceReport()
    ]);
});

try {
    Route::dispatch();
} catch (Exception $e) {
    json_response(['error' => $e->getMessage()], 500);
}
?>
