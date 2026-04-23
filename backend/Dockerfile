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

# curl : strictement pour le HEALTHCHECK Docker (~3 Mo). Pas utilisé au runtime.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Utilisateur non-root dédié — si une CVE/RCE est exploitée dans une
# dépendance, l'attaquant n'a pas le root du container.
RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --home /app --shell /sbin/nologin app

WORKDIR /app
COPY --from=build /workspace/build/libs/*.war /app/app.war

# Images de référence (seed). Le volume uploads est initialisé avec ce
# contenu au premier boot (volume vide). Après, le volume persiste.
COPY uploads /app/uploads

# Le user "app" doit pouvoir écrire dans /app/uploads (création de
# sous-dossiers, écriture des fichiers uploadés)
RUN chown -R app:app /app

# Variables attendues au runtime (fournies par docker-compose.yml depuis .env) :
#   DATASOURCE_URL, DATASOURCE_USERNAME, DATASOURCE_PASSWORD
#   HC_JWT_SECRET (obligatoire en prod, ≥ 64 chars)
#   ADMIN_EMAIL, ADMIN_PASSWORD (obligatoires en prod)
#   SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM
ENV SPRING_PROFILES_ACTIVE=production

USER app:app
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s --retries=5 \
    CMD curl -fsS http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.war"]
