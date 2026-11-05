#!/bin/sh
# Runs ON the server (piped over SSH by .github/workflows/deploy.yml).
# Needs: DEPLOY_PATH (dir with docker-compose.yml + .env), IMAGE, TAG, REGISTRY_USER, REGISTRY_TOKEN.
set -eu

ATTEMPTS=30
SLEEP_SECONDS=2

cd "$DEPLOY_PATH"

APP_PORT="$(sed -n 's/^APP_PORT=//p' .env 2>/dev/null | tail -n 1 | tr -d "\"' ")"
HEALTH_URL="http://127.0.0.1:${APP_PORT:-3000}/api/health"
printf '%s' "$REGISTRY_TOKEN" | docker login ghcr.io -u "$REGISTRY_USER" --password-stdin >/dev/null
# Do not leave the registry token in ~/.docker/config.json.
trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT

previous_tag="$(cat .deployed-tag 2>/dev/null || true)"

rollback() {
  if [ -n "$previous_tag" ]; then
    echo "↩ Rolling back to $previous_tag" >&2
    IMAGE="$IMAGE" TAG="$previous_tag" docker compose up -d --remove-orphans
  fi
}

docker pull "$IMAGE:$TAG"
if ! IMAGE="$IMAGE" TAG="$TAG" docker compose up -d --remove-orphans; then
  echo "✖ docker compose up failed for $IMAGE:$TAG" >&2
  rollback
  exit 1
fi

healthy=0
i=0
while [ "$i" -lt "$ATTEMPTS" ]; do
  if wget -qO- "$HEALTH_URL" >/dev/null 2>&1; then healthy=1; break; fi
  i=$((i + 1))
  sleep "$SLEEP_SECONDS"
done

if [ "$healthy" -ne 1 ]; then
  echo "✖ $IMAGE:$TAG failed the health check." >&2
  rollback
  exit 1
fi

echo "$TAG" > .deployed-tag
docker image prune -f >/dev/null
echo "✔ Deployed $IMAGE:$TAG"
