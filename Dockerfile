# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM maven:3.8.8-eclipse-temurin-17 AS backend-builder
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline -B
COPY src ./src
# Copy compiled frontend static assets into Spring Boot's static resources folder
COPY --from=frontend-builder /app/client/dist ./src/main/resources/static/
RUN mvn package -DskipTests

# Stage 3: Runtime container
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/target/server-spring-0.0.1-SNAPSHOT.jar app.jar
ENV PORT=5000
EXPOSE 5000
ENTRYPOINT ["java", "-jar", "app.jar"]
