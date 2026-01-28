"""
Python Django - メインファイル（ルーティングのみ）
"""

import os
import django
from django.conf import settings
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from db import Database

# Django設定
if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY='django-insecure-key',
        INSTALLED_APPS=[],
        MIDDLEWARE=[],
        ROOT_URLCONF='main',
    )
    django.setup()

db = Database(':memory:')


class JSONRequest:
    def __init__(self, body):
        try:
            self.data = json.loads(body)
        except:
            self.data = {}

    def __getitem__(self, key):
        return self.data.get(key)

    def get(self, key, default=None):
        return self.data.get(key, default)


@require_http_methods(["GET"])
def health(request):
    return JsonResponse({'message': 'Python Django', 'status': 'OK'})


@require_http_methods(["POST"])
def create_user(request):
    try:
        req = JSONRequest(request.body)
        name = req.get('name')
        email = req.get('email')
        age = req.get('age')

        if not all([name, email, age]):
            return JsonResponse({'error': 'Missing fields'}, status=400)

        result = db.create_user(name, email, int(age))
        return JsonResponse({
            'success': True,
            'data': result,
            'performance': db.get_performance_report()
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_all_users(request):
    try:
        users = db.get_all_users()
        return JsonResponse({
            'success': True,
            'count': len(users),
            'data': users,
            'performance': db.get_performance_report()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_user(request, user_id):
    try:
        user = db.get_user(int(user_id))
        return JsonResponse({
            'success': user is not None,
            'data': user,
            'performance': db.get_performance_report()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["PUT"])
def update_user(request, user_id):
    try:
        req = JSONRequest(request.body)
        name = req.get('name')
        email = req.get('email')
        age = req.get('age')

        if not all([name, email, age]):
            return JsonResponse({'error': 'Missing fields'}, status=400)

        updated = db.update_user(int(user_id), name, email, int(age))
        return JsonResponse({
            'success': updated,
            'performance': db.get_performance_report()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["DELETE"])
def delete_user(request, user_id):
    try:
        deleted = db.delete_user(int(user_id))
        return JsonResponse({
            'success': deleted,
            'performance': db.get_performance_report()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["POST"])
def benchmark(request):
    try:
        req = JSONRequest(request.body)
        count = req.get('count', 1000)

        result = db.benchmark(int(count))
        return JsonResponse({
            'success': True,
            'benchmark': result,
            'performance': db.get_performance_report()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


urlpatterns = [
    path('', health),
    path('users', get_all_users),
    path('users', create_user),
    path('users/<int:user_id>', get_user),
    path('users/<int:user_id>', update_user),
    path('users/<int:user_id>', delete_user),
    path('benchmark', benchmark),
]

if __name__ == '__main__':
    from django.core.management import execute_from_command_line
    import sys

    print('Python Django サーバーが起動しました')
    print('リッスンポート: 6003')

    sys.argv = ['manage.py', 'runserver', '127.0.0.1:6003']
    execute_from_command_line(sys.argv)
