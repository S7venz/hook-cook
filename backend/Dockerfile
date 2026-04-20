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

ENV DATASOURCE_URL=jdbc:postgresql://postgres:5432/hookcook
ENV DATASOURCE_USERNAME=hookcook
ENV DATASOURCE_PASSWORD=hookcook
ENV SPRING_PROFILES_ACTIVE=production

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.war"]
