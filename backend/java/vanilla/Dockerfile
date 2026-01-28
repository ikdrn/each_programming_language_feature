FROM maven:3.8-openjdk-17 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:resolve

COPY . .
RUN mvn clean compile assembly:single -DskipTests

FROM openjdk:17-slim

WORKDIR /app

COPY --from=builder /app/target/java-vanilla-1.0-jar-with-dependencies.jar app.jar

EXPOSE 8001

CMD ["java", "-jar", "app.jar"]
