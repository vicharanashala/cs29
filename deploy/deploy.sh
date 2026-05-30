#!/bin/bash
# Vicharanashala FAQ Portal — EC2 deployment script
# Run this on your EC2 instance after setting DOCKER_USERNAME in the environment.
#
# Usage:
#   export DOCKER_USERNAME=yourdockerhubusername
#   bash deploy.sh

set -euo pipefail

: "${DOCKER_USERNAME:?Environment variable DOCKER_USERNAME must be set}"

COMPOSE_FILE="/home/ubuntu/docker-compose.prod.yml"

echo "==> Pulling latest images…"
docker pull "${DOCKER_USERNAME}/vicharanashala-backend:latest"
docker pull "${DOCKER_USERNAME}/vicharanashala-frontend:latest"

echo "==> Restarting containers…"
DOCKER_USERNAME="${DOCKER_USERNAME}" docker-compose -f "${COMPOSE_FILE}" up -d --remove-orphans

echo "==> Removing dangling images…"
docker image prune -f

echo "==> Done. Containers:"
docker-compose -f "${COMPOSE_FILE}" ps
