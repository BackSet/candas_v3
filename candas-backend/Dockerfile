FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw mvnw
COPY pom.xml pom.xml
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

COPY src/ src/
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /opt/app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-8080}/v3/api-docs" > /dev/null || exit 1

ENTRYPOINT ["java", "-jar", "/opt/app/app.jar"]
