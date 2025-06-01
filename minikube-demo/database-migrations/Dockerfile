FROM flyway/flyway:11.4-alpine

# Assuming we're building the image inside the `database-migrations` -folder
COPY sql/ /flyway/sql/

# Use shell form for entrypoint to get access to env variables
ENTRYPOINT ./flyway migrate -user=$FLYWAY_USER -password=$FLYWAY_PASSWORD -url="jdbc:postgresql://${MINIKUBE_DEMO_DATABASE_CLUSTER_RW_SERVICE_HOST}:${MINIKUBE_DEMO_DATABASE_CLUSTER_RW_SERVICE_PORT}/${FLYWAY_USER}"