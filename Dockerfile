# Multi-stage Dockerfile for StudyMate Spring Boot Backend
# Stage 1: Build JAR using Maven and Java 17
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build application artifact
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Java 17 Runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy built JAR from builder
COPY --from=build /app/target/studymate-ai-*.jar app.jar

# Environment defaults
ENV PORT=8080
ENV SERVER_MODE=true
EXPOSE 8080

# Run Spring Boot in headless server mode with container-aware memory tuning
ENTRYPOINT ["java", "-Djava.awt.headless=true", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
