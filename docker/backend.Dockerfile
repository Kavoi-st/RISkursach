FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app/backend

COPY backend/pom.xml ./pom.xml
COPY backend/src ./src

RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine

RUN apk add --no-cache wget

WORKDIR /app

COPY --from=build /app/backend/target/*.jar /app/backend.jar

ENV JAVA_OPTS=""
# Профиль задаётся в docker-compose (docker = без обязательного Redis)

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/backend.jar"]


