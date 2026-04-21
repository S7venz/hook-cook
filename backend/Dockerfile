########################################
# Stage 1 — build the Grails WAR
########################################
FROM eclipse-temurin:17-jdk-jammy AS build

WORKDIR /workspace
COPY gradle ./gradle
COPY gradlew gradle.properties settings.gradle build.gradle grails-wrapper.jar ./
COPY grailsw grailsw.bat ./
COPY src ./src
COPY grails-app ./grails-app

RUN chmod +x grailsw
RUN ./grailsw --stacktrace war

########################################
# Stage 2 — runtime
########################################
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app
COPY --from=build /workspace/build/libs/*.war /app/app.war

# Images de référence (seed). Le volume uploads est initialisé avec ce
# contenu au premier boot (volume vide). Après, le volume persiste.
COPY uploads /app/uploads

# Les variables suivantes sont attendues au runtime.
# Elles sont fournies par docker-compose.yml (qui les lit depuis .env) :
#   DATASOURCE_URL, DATASOURCE_USERNAME, DATASOURCE_PASSWORD
#   HC_JWT_SECRET
#   ADMIN_EMAIL, ADMIN_PASSWORD
#   SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM
# Si tu lances ce conteneur sans compose, tu dois les passer via -e VAR=valeur.
ENV SPRING_PROFILES_ACTIVE=production

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.war"]
