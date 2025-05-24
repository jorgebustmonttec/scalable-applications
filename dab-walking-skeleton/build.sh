#!/usr/bin/env bash
clear
echo "Building images…"
docker compose build            # uses cache → a few seconds

echo "Populating dependency volumes (only if empty)…"
docker compose run --rm client deno install --allow-scripts

echo "Starting stack…"
docker compose down
docker compose up --remove-orphans
