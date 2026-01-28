"""
Python Vanilla - メインファイル（ルーティングのみ）
標準ライブラリ http.server のみを使用
"""

import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from db import Database

db = Database(':memory:')
PORT = 6001


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """GET リクエスト処理"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path == '/':
            self._send_json({'message': 'Python Vanilla API', 'status': 'OK'})
        elif path == '/users':
            users = db.get_all_users()
            self._send_json({
                'success': True,
                'count': len(users),
                'data': users,
                'performance': db.get_performance_report()
            })
        elif path.startswith('/users/'):
            try:
                user_id = int(path.split('/')[-1])
                user = db.get_user(user_id)
                self._send_json({
                    'success': user is not None,
                    'data': user,
                    'performance': db.get_performance_report()
                })
            except (ValueError, IndexError):
                self._send_error(400, 'Invalid user ID')
        else:
            self._send_error(404, 'Not Found')

    def do_POST(self):
        """POST リクエスト処理"""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body.decode())

        path = urlparse(self.path).path

        if path == '/users':
            user = db.create_user(data['name'], data['email'], data['age'])
            self._send_json({
                'success': True,
                'data': user,
                'performance': db.get_performance_report()
            }, 201)
        elif path == '/benchmark':
            count = data.get('count', 1000)
            result = db.benchmark(count)
            self._send_json({
                'success': True,
                'benchmark': result,
                'performance': db.get_performance_report()
            })
        else:
            self._send_error(404, 'Not Found')

    def do_PUT(self):
        """PUT リクエスト処理"""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body.decode())

        path = urlparse(self.path).path

        if path.startswith('/users/'):
            try:
                user_id = int(path.split('/')[-1])
                updated = db.update_user(user_id, data['name'], data['email'], data['age'])
                self._send_json({
                    'success': updated,
                    'performance': db.get_performance_report()
                })
            except (ValueError, IndexError):
                self._send_error(400, 'Invalid user ID')
        else:
            self._send_error(404, 'Not Found')

    def do_DELETE(self):
        """DELETE リクエスト処理"""
        path = urlparse(self.path).path

        if path.startswith('/users/'):
            try:
                user_id = int(path.split('/')[-1])
                deleted = db.delete_user(user_id)
                self._send_json({
                    'success': deleted,
                    'performance': db.get_performance_report()
                })
            except (ValueError, IndexError):
                self._send_error(400, 'Invalid user ID')
        else:
            self._send_error(404, 'Not Found')

    def _send_json(self, data, status_code=200):
        """JSON レスポンスを送信"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error(self, status_code, message):
        """エラーレスポンスを送信"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode())

    def log_message(self, format, *args):
        """ログを抑制"""
        pass


if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), RequestHandler)
    print('Python Vanilla サーバーが起動しました')
    print(f'リッスンポート: {PORT}')
    server.serve_forever()
