FROM ruby:3.2-slim

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

COPY Gemfile Gemfile.lock* ./
RUN bundle install

COPY . .

EXPOSE 9001

CMD ["ruby", "main.rb"]
