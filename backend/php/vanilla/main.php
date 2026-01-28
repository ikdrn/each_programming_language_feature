<?php
/**
 * PHP Vanilla - メインファイル（ルーティングのみ）
 */

require_once 'db.php';

$db = new Database(':memory:');

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/users', '', $path);

function json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function get_json_body() {
    return json_decode(file_get_contents('php://input'), true);
}

try {
    if ($path === '' || $path === '/') {
        if ($method === 'GET') {
            json_response(['message' => 'PHP Vanilla', 'status' => 'OK']);
        }
    } elseif (preg_match('/^\/users$/', $path)) {
        if ($method === 'GET') {
            $users = $db->getAllUsers();
            json_response([
                'success' => true,
                'count' => count($users),
                'data' => $users,
                'performance' => $db->getPerformanceReport()
            ]);
        } elseif ($method === 'POST') {
            $body = get_json_body();
            $result = $db->createUser($body['name'], $body['email'], $body['age']);
            json_response([
                'success' => true,
                'data' => $result,
                'performance' => $db->getPerformanceReport()
            ], 201);
        }
    } elseif (preg_match('/^\/users\/(\d+)$/', $path, $matches)) {
        $userId = (int)$matches[1];
        if ($method === 'GET') {
            $user = $db->getUser($userId);
            json_response([
                'success' => $user !== null,
                'data' => $user,
                'performance' => $db->getPerformanceReport()
            ]);
        } elseif ($method === 'PUT') {
            $body = get_json_body();
            $updated = $db->updateUser($userId, $body['name'], $body['email'], $body['age']);
            json_response([
                'success' => $updated,
                'performance' => $db->getPerformanceReport()
            ]);
        } elseif ($method === 'DELETE') {
            $deleted = $db->deleteUser($userId);
            json_response([
                'success' => $deleted,
                'performance' => $db->getPerformanceReport()
            ]);
        }
    } elseif (preg_match('/^\/benchmark$/', $path)) {
        if ($method === 'POST') {
            $body = get_json_body();
            $count = $body['count'] ?? 1000;
            $result = $db->benchmark($count);
            json_response([
                'success' => true,
                'benchmark' => $result,
                'performance' => $db->getPerformanceReport()
            ]);
        }
    } else {
        json_response(['error' => 'Not Found'], 404);
    }
} catch (Exception $e) {
    json_response(['error' => $e->getMessage()], 500);
}
?>
