# 个人技术分享网站：从零到 1Panel 自动发布的落地方案

结合你的目标，我建议把网站做成一个以 Markdown 为内容源、GitHub 私有仓库管理版本、GitHub Actions 自动构建、1Panel + Docker Compose 运行、PostgreSQL 记录发布历史的个人技术内容平台。

它不仅能展示文章、视频和资源，还能让你在本地完成创作后，通过一次 `git push` 自动上线，并随时回看之前发布过的网站版本。

## 一、先确定最终技术架构

我建议首版采用以下技术栈，避免一开始就引入复杂的 CMS 和大量微服务。

| 模块     | 技术选择                         | 原因                     |
| ------ | ---------------------------- | ---------------------- |
| 网站前端   | Astro + TypeScript           | 适合技术博客、混合内容首页和静态页面生成   |
| UI 样式  | Tailwind CSS                 | 快速实现你希望的创意型九宫格布局       |
| 内容管理   | Markdown + YAML Frontmatter  | 本地编辑，Git 管理，迁移简单       |
| Git 仓库 | GitHub Private Repository    | 私有源码、内容和版本历史           |
| CI/CD  | GitHub Actions               | Push 后自动检查、构建和部署       |
| 内容数据库  | PostgreSQL                   | 保存内容索引、发布记录和版本元数据      |
| 后端 API | 首版不单独部署                      | 通过静态页面与构建流程即可满足大部分展示需求 |
| 反向代理   | 1Panel 管理的 Nginx 或 OpenResty | 域名、HTTPS、站点访问          |
| 部署环境   | 1Panel + Docker Compose      | 管理网站、数据库和持久化卷          |
| 图片及资源  | S3 兼容对象存储                    | 保存封面、文章图片、下载资源         |

首版的关键取舍： 网站本身采用静态生成，数据库只承担需要查询和长期保留的元数据，不让每次访问文章都依赖数据库。这样成本低、访问快，也更容易维护。

## 二、整体架构图

本地创作

VS Code · Markdown · 图片 · 视频链接 · 资源文件

GitHub 私有仓库

内容版本、代码、提交历史、发布标签

### GitHub Actions CI/CD

内容校验

构建静态站点

构建 Docker 镜像

触发生产部署

1Panel 生产环境

Nginx / OpenResty · Astro Web 容器 · PostgreSQL

持久化数据卷 · 备份 · 发布记录

这里有两个不同的版本管理概念：

- 内容版本：Git 中每次文章修改产生的提交历史。
- 网站发布版本：每次正式上线对应一个不可变版本，例如 `v1.0.0`、`v1.1.0`，并记录它对应的 Git commit 和镜像摘要。

你明确提出需要回看历次网站发布版本，因此下面重点围绕第二种设计，同时保留内容的 Git 历史。

## 三、GitHub 仓库与项目目录

建议将源码、Markdown 内容、部署配置放在同一个私有仓库中。首版不需要拆成多个仓库，发布版本与源码 commit 能够直接对应。

```
my-creative-site/
├── src/
│   ├── components/
│   │   ├── BentoGrid.astro
│   │   ├── ArticleCard.astro
│   │   ├── VideoCard.astro
│   │   └── ResourceCard.astro
│   ├── layouts/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── articles/
│   │   ├── videos/
│   │   ├── resources/
│   │   └── history.astro
│   └── content.config.ts
├── content/
│   ├── articles/
│   ├── videos/
│   └── resources/
├── public/
│   ├── images/
│   └── favicon.svg
├── scripts/
│   ├── validate-content.mjs
│   └── release.sh
├── db/
│   └── migrations/
│       └── 001_init.sql
├── deploy/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── compose.yaml
│   ├── .env.production.example
│   └── deploy.sh
├── .github/
│   └── workflows/
│       └── deploy.yml
├── astro.config.mjs
├── package.json
├── package-lock.json
└── README.md
```

有两个设计细节值得提前固定：

1. 文章 URL 尽量使用稳定的 slug，例如 `/articles/yolo26-onnx/`，不要把标题或发布日期直接作为 URL 的唯一标识。
2. 图片尽量使用独立资源地址，不要依赖 GitHub 仓库的原始文件链接。图片和大文件可以放在对象存储，仓库只保存引用。

Astro 的内容集合支持通过 schema 校验 Markdown 的 Frontmatter，因此可以在构建阶段发现缺失标题、错误日期等问题，而不是等到上线才发现。

[image](https://www.google.com/s2/favicons?domain=https://v5.docs.astro.build\&sz=32)

Docs

+1



### 内容文件示例

文件：`content/articles/yolo26-onnx.md`

```
---
title: "YOLO26 ONNX 推理实践"
slug: "yolo26-onnx"
type: "article"
date: 2026-10-19
summary: "从模型导出到 ONNX Runtime 部署。"
cover: "/images/yolo26-cover.webp"
tags:
  - AI
  - ONNX
  - 计算机视觉
status: "published"
---

# YOLO26 ONNX 推理实践

这里开始编写正文。

## 1. 模型导出

介绍模型转换流程。

## 2. ONNX Runtime 推理

放入代码示例。
```

视频内容可以增加 `videoUrl`，资源内容可以增加 `downloadUrl`、`githubUrl`。三类内容共用相同的基础元数据，首页统一混排，详情页按类型选择对应模板。

## 四、数据库 DDL：发布历史与内容索引

首版建议使用 PostgreSQL。即使前台主要是静态页面，数据库仍然可以保存正式发布的记录，方便未来增加版本查询页面、管理后台和发布审计。

先创建 `db/migrations/001_init.sql`：

```
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 内容主表：存放内容元数据，不替代 Git 中的 Markdown。
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(200) NOT NULL UNIQUE,
    title VARCHAR(300) NOT NULL,
    content_type VARCHAR(20) NOT NULL
        CHECK (content_type IN ('article', 'video', 'resource')),
    summary TEXT,
    cover_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived')),
    source_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contents_type_status
    ON contents (content_type, status);

CREATE INDEX idx_contents_updated_at
    ON contents (updated_at DESC);

-- 正式发布记录：每次成功部署产生一条记录。
CREATE TABLE deployments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    release_version VARCHAR(100) NOT NULL UNIQUE,
    git_sha VARCHAR(64) NOT NULL,
    image_ref TEXT NOT NULL,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('deploying', 'success', 'failed', 'rolled_back')),
    deployed_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    triggered_by VARCHAR(200),
    release_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deployments_history
    ON deployments (deployed_at DESC);

-- 可选：记录发布前后的状态变化。
CREATE TABLE deployment_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    deployment_id BIGINT NOT NULL
        REFERENCES deployments(id),
    event_type VARCHAR(50) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 每个站点一个当前版本指针。
CREATE TABLE site_current_release (
    site_key VARCHAR(100) PRIMARY KEY,
    deployment_id BIGINT NOT NULL REFERENCES deployments(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

这里有一个需要注意的地方：`deployments` 只记录发布事件，不是完整的文件备份。真正恢复历史网站时，必须保留对应的 Git commit 和构建镜像。

### 发布历史数据示例

| 版本       | Git commit | 状态      | 用途      |
| -------- | ---------- | ------- | ------- |
| `v1.0.0` | `a13f9c2`  | success | 第一版正式上线 |
| `v1.1.0` | `d48b1e7`  | success | 调整首页九宫格 |
| `v1.2.0` | `f72c6a1`  | success | 增加资源分享页 |

正式版本应同时保存完整 commit SHA、镜像标签以及镜像 digest（如果使用支持 digest 的镜像仓库），不能只保存短 SHA 或 `latest`。Docker 文档也建议使用不可变 digest 固定镜像版本。

[image](https://www.google.com/s2/favicons?domain=https://docs.docker.com\&sz=32)

Docker Docs



另外，数据库的 `status` 字段表示部署记录的状态，而 `site_current_release` 表表示当前线上指向哪个版本。两者不要混用：一个版本可能发布过，后来又被回滚。

## 五、1Panel + Docker Compose 部署配置

部署建议分成两个独立部分：

- `web`：只负责提供 Astro 构建出来的静态文件。
- `db`：只负责保存发布记录和内容元数据。

初期不用为网站的每次访问启动后端进程。以后需要浏览器直接查看数据库中的发布历史时，再增加只读 API 服务；也可以先由 CI 生成静态历史页面。

### 5.1 Dockerfile

文件：`deploy/Dockerfile`

```
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.28-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
```

这里使用多阶段构建，生产镜像不包含 Node.js 开发环境和完整源码依赖。

### 5.2 Nginx 配置

文件：`deploy/nginx.conf`

```
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location = /health {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    location ~* \.(css|js|svg|png|jpg|jpeg|webp|woff2)$ {
        expires 7d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }
}
```

这是静态站点配置，具体的文章路由要与你的 Astro 路由生成方式保持一致。若使用客户端路由或 SPA，需要再调整 fallback 规则。

### 5.3 Docker Compose

文件：`deploy/compose.yaml`

```
services:
  web:
    image: ${SITE_IMAGE:?SITE_IMAGE must be set}
    restart: unless-stopped
    ports:
      - "127.0.0.1:18080:80"
    networks:
      - site-net
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null",
             "http://127.0.0.1/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:?required}
      POSTGRES_USER: ${POSTGRES_USER:?required}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?required}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./../db/migrations:/docker-entrypoint-initdb.d:ro
    networks:
      - site-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  site-net:

volumes:
  postgres-data:
```

说明：

- `web` 只绑定服务器本机的 `127.0.0.1:18080`，再通过 1Panel 的网站反向代理对外提供访问。
- PostgreSQL 不映射公网端口，只允许内部容器网络访问。
- `postgres-data` 必须使用持久化卷。
- `docker-entrypoint-initdb.d` 中的 SQL 只会在首次初始化空数据库时自动执行；后续数据库变更应使用明确的迁移流程，不能指望重启容器自动执行新增 SQL。
- 生产环境建议固定数据库镜像的具体版本，并在升级前备份。

1Panel 可以通过编排文件创建和管理 Compose 项目，支持直接使用服务器上的 `compose.yaml`。

[image](https://www.google.com/s2/favicons?domain=https://1panel.pro\&sz=32)

1Panel Docs



### 5.4 生产环境变量

文件：`deploy/.env.production`，仅保存在服务器上，不提交 Git。

```
SITE_IMAGE=ghcr.io/YOUR_GITHUB_USER/my-creative-site:main-REPLACE_WITH_SHA

POSTGRES_DB=creative_site
POSTGRES_USER=creative_site
POSTGRES_PASSWORD=REPLACE_WITH_A_LONG_RANDOM_SECRET
```

实际部署时，CI 会把 `SITE_IMAGE` 更新为本次构建的镜像版本。

注意：如果 GitHub Container Registry 中的镜像是私有的，服务器需要预先配置有读取权限的镜像仓库凭据。不要把访问令牌写入 Compose 文件或提交到 GitHub。

## 六、自动发布脚本

发布脚本负责把 CI 传来的版本号写入服务器配置、拉取镜像、切换服务，并记录发布结果。

文件：`deploy/deploy.sh`

```
#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/creative-site"
COMPOSE_FILE="$APP_DIR/compose.yaml"
ENV_FILE="$APP_DIR/.env.production"

VERSION="${1:?release version required}"
IMAGE="${2:?image reference required}"
GIT_SHA="${3:?git sha required}"

cd "$APP_DIR"

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
    echo "Release $VERSION deployed: $GIT_SHA"
    exit 0
  fi
fi

echo "Deployment failed. Restoring previous image configuration."

cp "$ENV_FILE.previous" "$ENV_FILE"
compose up -d --no-deps web || true

exit 1
```

这是一份最小的切换脚本。正式投入使用前，还需要将发布状态写入数据库、执行应用层 HTTP 健康检查，并在回滚后确认旧版本确实恢复。上面恢复旧镜像配置的逻辑并不等于完整的事务式发布。

此外，`compose.yaml` 和 `db/migrations` 需要在服务器上有稳定的部署路径。建议在初始化服务器时将它们安装到 `/opt/creative-site/`，或者让部署脚本从固定的 Git commit 中更新部署配置。不要每次上线都随意覆盖数据库文件或持久化卷。

## 七、GitHub Actions：提交后自动上线

推荐发布机制是：

1. GitHub Actions 检查 Markdown 和项目代码。
2. 构建静态站点 Docker 镜像。
3. 将镜像推送到 GitHub Container Registry（GHCR）。
4. 通过 SSH 通知 1Panel 服务器部署指定镜像。
5. 检查健康状态，记录发布结果。

GitHub Actions 的 `production` Environment 可以限制允许部署的分支、保护部署密钥，也可以在正式上线前设置人工审批。

[image](https://www.google.com/s2/favicons?domain=https://docs.github.com\&sz=32)

GitHub Docs

+1



### 7.1 配置 GitHub Secrets

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中配置：

| Secret               | 用途                 |
| -------------------- | ------------------ |
| `DEPLOY_HOST`        | 服务器 IP 或域名         |
| `DEPLOY_USER`        | 专用部署用户             |
| `DEPLOY_SSH_KEY`     | 部署用户的 SSH 私钥       |
| `DEPLOY_KNOWN_HOSTS` | 预先验证过的服务器 SSH 主机公钥 |

此外，需要为 GHCR 配置服务器端只读拉取凭据，或使用其他安全的镜像认证方案。SSH 账号应限制权限，不建议直接使用 root 账号。

### 7.2 完整工作流示例

文件：`.github/workflows/deploy.yml`

```
name: Build and Deploy

on:
  push:
    branches: [main]
    tags: ["v*"]
  workflow_dispatch:

permissions:
  contents: read
  packages: write

concurrency:
  group: production-deploy
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.meta.outputs.image }}
      version: ${{ steps.meta.outputs.version }}
      sha: ${{ steps.meta.outputs.sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm

      - name: Install
        run: npm ci

      - name: Validate content
        run: npm run check

      - name: Build site
        run: npm run build

      - name: Set image metadata
        id: meta
        shell: bash
        run: |
          OWNER="$(echo '${{ github.repository_owner }}' | tr '[:upper:]' '[:lower:]')"
          echo "image=ghcr.io/${OWNER}/my-creative-site:${GITHUB_SHA}" >> "$GITHUB_OUTPUT"
          echo "sha=${GITHUB_SHA}" >> "$GITHUB_OUTPUT"

          if [[ "$GITHUB_REF" == refs/tags/v* ]]; then
            VERSION="${GITHUB_REF_NAME}"
          else
            VERSION="build-${GITHUB_RUN_NUMBER}"
          fi

          echo "version=${VERSION}" >> "$GITHUB_OUTPUT"

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: deploy/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.image }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to 1Panel server
        uses: appleboy/ssh-action@v1
        env:
          RELEASE_VERSION: ${{ needs.build.outputs.version }}
          IMAGE_REF: ${{ needs.build.outputs.image }}
          GIT_SHA: ${{ needs.build.outputs.sha }}
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          envs: RELEASE_VERSION,IMAGE_REF,GIT_SHA
          script: |
            /opt/creative-site/deploy.sh \
              "$RELEASE_VERSION" \
              "$IMAGE_REF" \
              "$GIT_SHA"
```

这份配置是实施模板，落地前要确认 `package.json` 中存在 `check` 和 `build` 命令，并确认服务器上已安装部署脚本。

另外有两点需要特别处理：

- 将 `my-creative-site` 改成实际的镜像包名，并确保服务器能拉取该包。
- 正式生产建议将 Actions 引用固定到经过审查的完整 commit SHA，而不是长期依赖可变的版本标签；首次部署也应先在测试环境验证 SSH、镜像权限和回滚流程。

### 7.3 日常发布怎么操作？

```
git add content/ src/
git commit -m "feat: publish YOLO26 ONNX article"
git push origin main
```

推送后自动构建和部署。

当你希望标记一个正式版本时：

```
git tag v1.0.0
git push origin v1.0.0
```

后续可以用 `v1.1.0`、`v1.2.0` 等版本标记重要的视觉改版、内容结构调整或功能更新。

注意： `build-123` 这样的流水线编号是构建版本，不一定等于语义化正式版本。正式版本与普通自动构建版本建议在发布记录中区分。

## 八、如何让数据库真正记录每一次发布？

目前的 CI 配置已经能够完成镜像构建和部署，但还需要把每次发布写入 PostgreSQL。建议在部署脚本中，健康检查成功后执行数据库记录操作。

例如，在 `deploy.sh` 的成功分支中加入以下逻辑。前提是前面的 DDL 已经在数据库初始化时执行，且数据库容器正常运行。

```
# 发布成功后记录版本信息。
# VERSION、GIT_SHA、IMAGE 已经过格式校验。
docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec -T db \
  psql -v ON_ERROR_STOP=1 \
    -U creative_site \
    -d creative_site \
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
```

需要注意：这里的 `ON CONFLICT DO NOTHING` 适合版本号唯一且不重复发布的策略。如果需要重复部署同一版本，应该采用独立的部署流水线 ID 作为唯一键，而不是静默忽略记录。

生产实现还应做到：

- 部署开始时记录 `deploying`。
- 部署成功后更新为 `success`。
- 部署失败时更新为 `failed`。
- 回滚时单独记录回滚事件，不覆盖原来的成功发布记录。
- 只有健康检查成功后，才更新当前线上版本指针。

数据库记录失败时，也不能简单地把已经上线的网站视为部署失败并自动恢复旧版本。更合理的方式是重试记录操作、保留本次部署信息并告警。

## 九、网站历史版本页面怎么做？

你之前的网站设计是文章、视频、资源混合的九宫格风格。我建议在个人介绍或关于页面增加一个低调的「版本档案」入口。

## 版本档案

网站的演进记录

### v1.2.0

2026-10-19

资源分享页上线

新增资源详情页与分类导航

Commit: f72c6a1

### v1.1.0

2026-10-12

首页布局调整

优化九宫格混排和内容卡片

Commit: d48b1e7

### v1.0.0

2026-10-01

网站首次发布

文章、视频、资源基础功能

Commit: a13f9c2

以上是展示原型数据，并非实际发布记录。正式页面应从数据库读取真实记录。

这里建议把「查看历史」和「恢复历史」分开设计。

- 查看历史：浏览某个版本的发布时间、更新说明、提交 SHA，必要时提供历史站点预览。
- 恢复历史：通过管理操作重新部署指定的历史镜像，并将这次回滚作为新的部署事件记录。

### 历史版本预览怎么实现？

只保存镜像标签还不够。建议在生产环境保留每个正式发布的镜像，历史预览可以有两种方式：

1. 简单方案： 通过 GitHub Release、commit 和发布记录回看版本信息，需要查看旧页面时在本地或测试环境启动对应版本。
2. 进阶方案： 为历史发布创建独立的预览入口，例如 `preview.example.com/v1.1.0/`，通过反向代理将请求转发到指定版本的静态站点容器。

第二种方案更适合你希望长期积累个人创作档案的目标，但要额外处理资源路径、旧页面链接、容器清理和预览权限。

## 十、从零部署的实施顺序

## 实施清单

0/7 已完成

初始化项目

创建 Astro + TypeScript 项目，完成首页和三类内容模板。

建立内容规范

定义 Frontmatter schema、Markdown 目录和图片引用规则。

创建 GitHub 私有仓库

提交源码，配置 main 分支保护和 Actions。

部署 1Panel 环境

创建 Compose 项目、持久化数据库卷和反向代理。

配置 CI/CD

配置 GHCR、SSH 密钥、服务器部署脚本和健康检查。

接入发布历史

执行数据库迁移，记录版本、commit、镜像和部署状态。

验证回滚和备份

模拟构建失败、部署失败、数据库备份恢复及旧版本回滚。

数据库备份建议采用定期 `pg_dump`，并将备份文件存储到独立于服务器本地卷的位置；正式部署前要实际演练恢复。镜像保留策略则要确保至少保留最近几个成功版本，以及所有正式版本对应的镜像。

## 十一、最终建议

先不要急着开发复杂的管理后台。第一阶段把下面这条链路跑通：

本地 Markdown → GitHub 私有仓库 → Actions 构建镜像 → GHCR → 1Panel 部署 → PostgreSQL 记录发布历史。

当这条链路稳定后，再开发版本档案页面、历史预览、后台检索和一键回滚。这样既能快速上线，也能避免未来因为内容管理和部署耦合而重构整个系统。

参考文档：

- [Astro 内容集合](https://docs.astro.build/en/guides/content-collections/?utm_source=chatgpt.com)
- [GitHub Actions 文档](https://docs.github.com/en/actions?utm_source=chatgpt.com)
- [1Panel Compose 编排文档](https://1panel.pro/docs/v2/user_manual/containers/composes/?utm_source=chatgpt.com)
- [Docker Compose 文档](https://docs.docker.com/compose/?utm_source=chatgpt.com)