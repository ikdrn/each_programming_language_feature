FROM maven:3.8-openjdk-17 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:resolve

COPY . .
RUN mvn clean package -DskipTests

FROM openjdk:17-slim

WORKDIR /app

COPY --from=builder /app/target/java-springboot-1.0.jar app.jar

EXPOSE 8002

CMD ["java", "-jar", "app.jar"]
