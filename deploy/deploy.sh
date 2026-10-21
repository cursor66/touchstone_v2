#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/creative-site"
COMPOSE_FILE="$APP_DIR/compose.yaml"
ENV_FILE="$APP_DIR/.env.production"

VERSION="${1:?release version required}"
IMAGE="${2:?image reference required}"
GIT_SHA="${3:?git sha required}"

cd "$APP_DIR"

# 载入数据库等环境变量，供发布记录写入使用。
set -a
. "$ENV_FILE"
set +a

# 只接受预期格式，防止参数注入。
[[ "$VERSION" =~ ^[a-zA-Z0-9._-]+$ ]] || exit 2
[[ "$GIT_SHA" =~ ^[a-f0-9]{40}$ ]] || exit 2
[[ "$IMAGE" =~ ^ghcr\.io/[a-zA-Z0-9._/-]+:[a-f0-9]{40}$ ]] || exit 2

# 保留当前版本，供部署失败时人工恢复。
cp "$ENV_FILE" "$ENV_FILE.previous"

# 替换镜像引用；镜像标签使用完整 commit SHA。
if grep -q '^SITE_IMAGE=' "$ENV_FILE"; then
  sed -i "s|^SITE_IMAGE=.*|SITE_IMAGE=$IMAGE|" "$ENV_FILE"
else
  printf '\nSITE_IMAGE=%s\n' "$IMAGE" >> "$ENV_FILE"
fi

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" "$@"
}

# 拉取镜像并更新服务。
if compose pull web &&
   compose up -d --no-deps web; then

  # 等待容器健康检查成功。
  for i in $(seq 1 30); do
    HEALTH=$(docker inspect \
      --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      "$(compose ps -q web)" 2>/dev/null || true)

    if [ "$HEALTH" = "healthy" ]; then
      break
    fi
    sleep 2
  done

  if [ "${HEALTH:-}" = "healthy" ]; then
    # 发布成功后记录版本信息。
    docker compose \
      --env-file "$ENV_FILE" \
      -f "$COMPOSE_FILE" \
      exec -T db \
      psql -v ON_ERROR_STOP=1 \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -v version="$VERSION" \
        -v sha="$GIT_SHA" \
        -v image="$IMAGE" <<'SQL'
INSERT INTO deployments (
    release_version,
    git_sha,
    image_ref,
    status,
    deployed_at,
    finished_at
)
VALUES (
    :'version',
    :'sha',
    :'image',
    'success',
    NOW(),
    NOW()
)
ON CONFLICT (release_version)
DO NOTHING;
SQL

    echo "Release $VERSION deployed: $GIT_SHA"
    exit 0
  fi
fi

echo "Deployment failed. Restoring previous image configuration."

cp "$ENV_FILE.previous" "$ENV_FILE"
compose up -d --no-deps web || true

exit 1
