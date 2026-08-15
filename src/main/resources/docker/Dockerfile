FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN mkdir -p /app/logs /app/images

COPY target/MiddleTier-Recipe-*.jar app.jar
COPY scripts/docker-entrypoint.sh /app/scripts/docker-entrypoint.sh

RUN chmod +x /app/scripts/docker-entrypoint.sh

ENV LOGGING_FILE_NAME=/app/logs/recipe.log
ENV RECIPE_IMAGE_LOCATION=/app/images
ENV SPRING_PROFILES_ACTIVE=pdn

VOLUME ["/app/logs", "/app/images"]

EXPOSE 8080

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
