#!/usr/bin/env ruby
# Ruby Rails - メインファイル（ルーティングのみ）

require 'rack'
require 'json'
require_relative 'db'

$db = Database.new ':memory:'

class Api
  def initialize
    @app = lambda do |env|
      request = Rack::Request.new(env)
      response = Rack::Response.new

      begin
        case request.path_info
        when '/'
          if request.get?
            response.write(JSON.generate({ message: 'Ruby Rails', status: 'OK' }))
          else
            response.status = 404
            response.write(JSON.generate({ error: 'Not Found' }))
          end

        when '/users'
          if request.get?
            users = $db.get_all_users
            response.write(JSON.generate({
              success: true,
              count: users.length,
              data: users,
              performance: $db.get_performance_report
            }))
          elsif request.post?
            body = JSON.parse(request.body.read)
            result = $db.create_user(body['name'], body['email'], body['age'].to_i)
            response.status = 201
            response.write(JSON.generate({
              success: true,
              data: result,
              performance: $db.get_performance_report
            }))
          else
            response.status = 404
            response.write(JSON.generate({ error: 'Not Found' }))
          end

        when %r{^/users/(\d+)$}
          user_id = request.path_info.match(%r{^/users/(\d+)$})[1].to_i

          if request.get?
            user = $db.get_user(user_id)
            response.write(JSON.generate({
              success: user != nil,
              data: user,
              performance: $db.get_performance_report
            }))
          elsif request.put?
            body = JSON.parse(request.body.read)
            updated = $db.update_user(user_id, body['name'], body['email'], body['age'].to_i)
            response.write(JSON.generate({
              success: updated,
              performance: $db.get_performance_report
            }))
          elsif request.delete?
            deleted = $db.delete_user(user_id)
            response.write(JSON.generate({
              success: deleted,
              performance: $db.get_performance_report
            }))
          else
            response.status = 404
            response.write(JSON.generate({ error: 'Not Found' }))
          end

        when '/benchmark'
          if request.post?
            body = JSON.parse(request.body.read)
            count = body['count'] || 1000
            result = $db.benchmark(count)
            response.write(JSON.generate({
              success: true,
              benchmark: result,
              performance: $db.get_performance_report
            }))
          else
            response.status = 404
            response.write(JSON.generate({ error: 'Not Found' }))
          end

        else
          response.status = 404
          response.write(JSON.generate({ error: 'Not Found' }))
        end
      rescue => e
        response.status = 500
        response.write(JSON.generate({ error: e.message }))
      end

      response['Content-Type'] = 'application/json'
      response.finish
    end
  end

  def call(env)
    @app.call(env)
  end
end

Rack::Handler::WEBrick.run(
  Api.new,
  Port: 9002,
  BindAddress: '127.0.0.1',
  AccessLog: [],
  Logger: WEBrick::Log.new('/dev/null')
)

puts 'Ruby Rails サーバーが起動しました'
puts 'リッスンポート: 9002'
