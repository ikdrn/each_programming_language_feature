#!/usr/bin/env ruby
# Ruby Vanilla - メインファイル（ルーティングのみ）

require 'webrick'
require 'json'
require_relative 'db'

$db = Database.new ':memory:'

server = WEBrick::HTTPServer.new(
  :Port => 9001,
  :BindAddress => '127.0.0.1',
  :AccessLog => [],
  :Logger => WEBrick::Log.new('/dev/null')
)

def json_response(body, status = 200)
  {
    :status => status,
    'Content-Type' => 'application/json'
  }.merge(body)
end

server.mount_proc '/' do |req, res|
  if req.request_method == 'GET' && req.path == '/'
    res.status = 200
    res.content_type = 'application/json'
    res.body = JSON.generate({ message: 'Ruby Vanilla', status: 'OK' })
  else
    res.status = 404
    res.content_type = 'application/json'
    res.body = JSON.generate({ error: 'Not Found' })
  end
end

server.mount_proc '/users' do |req, res|
  begin
    res.content_type = 'application/json'

    if req.request_method == 'GET' && req.path == '/users'
      users = $db.get_all_users
      res.status = 200
      res.body = JSON.generate({
        success: true,
        count: users.length,
        data: users,
        performance: $db.get_performance_report
      })
    elsif req.request_method == 'POST' && req.path == '/users'
      body = JSON.parse(req.body)
      result = $db.create_user(body['name'], body['email'], body['age'].to_i)
      res.status = 201
      res.body = JSON.generate({
        success: true,
        data: result,
        performance: $db.get_performance_report
      })
    else
      res.status = 404
      res.body = JSON.generate({ error: 'Not Found' })
    end
  rescue => e
    res.status = 500
    res.body = JSON.generate({ error: e.message })
  end
end

server.mount_proc '/users/' do |req, res|
  begin
    res.content_type = 'application/json'

    match = req.path.match(/^\/users\/(\d+)$/)
    unless match
      res.status = 404
      res.body = JSON.generate({ error: 'Not Found' })
      next
    end

    user_id = match[1].to_i

    if req.request_method == 'GET'
      user = $db.get_user(user_id)
      res.status = 200
      res.body = JSON.generate({
        success: user != nil,
        data: user,
        performance: $db.get_performance_report
      })
    elsif req.request_method == 'PUT'
      body = JSON.parse(req.body)
      updated = $db.update_user(user_id, body['name'], body['email'], body['age'].to_i)
      res.status = 200
      res.body = JSON.generate({
        success: updated,
        performance: $db.get_performance_report
      })
    elsif req.request_method == 'DELETE'
      deleted = $db.delete_user(user_id)
      res.status = 200
      res.body = JSON.generate({
        success: deleted,
        performance: $db.get_performance_report
      })
    else
      res.status = 404
      res.body = JSON.generate({ error: 'Not Found' })
    end
  rescue => e
    res.status = 500
    res.body = JSON.generate({ error: e.message })
  end
end

server.mount_proc '/benchmark' do |req, res|
  begin
    res.content_type = 'application/json'

    if req.request_method == 'POST'
      body = JSON.parse(req.body)
      count = body['count'] || 1000
      result = $db.benchmark(count)
      res.status = 200
      res.body = JSON.generate({
        success: true,
        benchmark: result,
        performance: $db.get_performance_report
      })
    else
      res.status = 404
      res.body = JSON.generate({ error: 'Not Found' })
    end
  rescue => e
    res.status = 500
    res.body = JSON.generate({ error: e.message })
  end
end

trap('INT') { server.shutdown }

puts 'Ruby Vanilla サーバーが起動しました'
puts 'リッスンポート: 9001'
server.start
