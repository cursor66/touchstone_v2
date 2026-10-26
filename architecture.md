# 个人技术分享网站：从零到 Cloudflare 自动发布的落地方案

结合你的目标，我建议把网站做成一个以 Markdown 为内容源、GitHub 私有仓库管理版本、GitHub Actions 自动构建、Cloudflare Pages 部署运行、Cloudflare D1 记录发布历史的个人技术内容平台。

它不仅能展示文章、视频和资源，还能让你在本地完成创作后，通过一次 `git push` 自动上线，并随时回看之前发布过的网站版本。

产品初期采用 Cloudflare 全套方案，可以实现零服务器运维、全球 CDN 加速、免费额度充足，同时通过 Cloudflare D1（SQLite）保存发布记录，未来可平滑迁移到自托管方案。

## 一、先确定最终技术架构

我建议首版采用以下技术栈，避免一开始就引入复杂的 CMS 和大量微服务。

| 模块     | 技术选择                         | 原因                     |
| ------ | ---------------------------- | ---------------------- |
| 网站前端   | Astro + TypeScript           | 适合技术博客、混合内容首页和静态页面生成   |
| UI 样式  | Tailwind CSS                 | 快速实现你希望的创意型九宫格布局       |
| 内容管理   | Markdown + YAML Frontmatter  | 本地编辑，Git 管理，迁移简单       |
| Git 仓库 | GitHub Private Repository    | 私有源码、内容和版本历史           |
| CI/CD  | GitHub Actions               | Push 后自动检查、构建和部署       |
| 内容数据库  | Cloudflare D1 (SQLite)       | 保存内容索引、发布记录和版本元数据，免费额度充足 |
| 后端 API | Cloudflare Pages Functions   | 按需提供发布历史查询等只读 API，无需独立部署 |
| CDN/边缘 | Cloudflare Pages             | 全球 CDN 加速，自动 HTTPS，零服务器运维 |
| 部署环境   | Cloudflare Pages + D1        | 静态站点托管 + Serverless 数据库 |
| 图片及资源  | Cloudflare R2                 | S3 兼容对象存储，零出口费用，保存封面、文章图片、下载资源 |

首版的关键取舍： 网站本身采用静态生成，数据库只承担需要查询和长期保留的元数据，不让每次访问文章都依赖数据库。Cloudflare 全家桶在免费额度内即可覆盖初期所有需求，成本几乎为零，且未来可平滑迁移到自托管方案。

## 二、整体架构图

本地创作

VS Code · Markdown · 图片 · 视频链接 · 资源文件

GitHub 私有仓库

内容版本、代码、提交历史、发布标签

### GitHub Actions CI/CD

内容校验

构建静态站点

部署到 Cloudflare Pages

记录发布版本到 D1

Cloudflare 生产环境

Pages (全球 CDN) · Pages Functions · D1 (SQLite)

R2 对象存储 · 自动 HTTPS · 发布历史

这里有两个不同的版本管理概念：

- 内容版本：Git 中每次文章修改产生的提交历史。
- 网站发布版本：每次正式上线对应一个不可变版本，例如 `v1.0.0`、`v1.1.0`，并记录它对应的 Git commit 和 Cloudflare Pages 部署 ID。

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
├── functions/
│   └── api/
│       └── deployments.ts
├── wrangler.toml
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

### 首页九宫格内容更新策略

目标是每次内容更新后，用户打开网站第一屏看到的九宫格内容都是最新的。核心思路：**构建时按更新时间倒序截取最新内容填充首屏九宫格，配合静态增量构建实现秒级生效。**

#### 实现机制

1. **Frontmatter 增加权重字段**

每条内容通过 Frontmatter 控制是否出现在首屏九宫格：

```
---
title: "YOLO26 ONNX 推理实践"
slug: "yolo26-onnx"
type: "article"
date: 2026-10-19
updated_at: 2026-10-23       # 新增：内容更新时间
pin: false                    # 新增：是否强制置顶到九宫格
priority: 0                   # 新增：排序权重，数值越大越靠前
summary: "从模型导出到 ONNX Runtime 部署。"
cover: "/images/yolo26-cover.webp"
tags:
  - AI
  - ONNX
status: "published"
---
```

- `pin: true` 的内容始终占据九宫格前几位，用于重要公告或精选内容。
- `priority` 用于同一天内多篇更新的微调排序，默认为 0。
- 其余格子按 `updated_at` 倒序填充。

2. **Astro 构建时排序逻辑**

`src/pages/index.astro` 在构建时从内容集合中拉取所有已发布内容，按 `pin → priority → updated_at` 三级排序后截取前 9 条（或 12 条），生成首屏九宫格：

```
---
import { getCollection } from 'astro:content';
import BentoGrid from '../components/BentoGrid.astro';

const all = await getCollection('articles', ({ data }) => data.status === 'published');
const videos = await getCollection('videos', ({ data }) => data.status === 'published');
const resources = await getCollection('resources', ({ data }) => data.status === 'published');

const items = [...all, ...videos, ...resources]
  .sort((a, b) => {
    // 第一级：pin 置顶
    if (a.data.pin && !b.data.pin) return -1;
    if (!a.data.pin && b.data.pin) return 1;
    // 第二级：priority 高的靠前
    if ((b.data.priority ?? 0) !== (a.data.priority ?? 0)) {
      return (b.data.priority ?? 0) - (a.data.priority ?? 0);
    }
    // 第三级：updated_at 倒序
    return new Date(b.data.updated_at ?? b.data.date)
         - new Date(a.data.updated_at ?? a.data.date);
  })
  .slice(0, 9);  // 首屏九宫格只取 9 条
---

<BentoGrid items={items} />
```

3. **增量构建确保即时生效**

Cloudflare Pages 每次 `git push` 后触发 GitHub Actions 自动构建部署，从 push 到上线通常 1-2 分钟。配合以下措施进一步提速：

- **Astro 增量构建**：Astro 的内容集合缓存机制使仅内容变更时构建很快，不必每次全量重算。
- **首页优先**：构建产物中 `index.html` 是最先生成的页面之一，CDN 推送后用户立即看到更新。
- **CDN 缓存策略**：HTML 页面设置短缓存（如 `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`），静态资源（CSS/JS/图片）设置长缓存（7 天）。这样内容更新后最长 5 分钟内所有用户都能看到新九宫格。

4. **九宫格之外的增量内容**

首屏九宫格只展示最新 9 条，下方再接一个"最近更新"信息流列表（15-20 条），保证用户向下滚动也能看到更多新内容。超出部分引导到分类页 `/articles/`、`/videos/`、`/resources/` 继续浏览。

#### 需要目录结构补充的文件

```
├── src/
│   ├── components/
│   │   ├── BentoGrid.astro          # 首屏九宫格组件
│   │   ├── BentoCard.astro           # 单个九宫格卡片（统一渲染 article/video/resource）
│   │   ├── ArticleCard.astro
│   │   ├── VideoCard.astro
│   │   ├── ResourceCard.astro
│   │   └── RecentUpdates.astro       # 首屏下方的"最近更新"信息流
│   ├── utils/
│   │   └── content-sort.ts          # 内容排序工具函数（pin → priority → updated_at）
```

## 四、数据库 DDL：发布历史与内容索引

首版建议使用 Cloudflare D1（基于 SQLite）。即使前台主要是静态页面，数据库仍然可以保存正式发布的记录，方便未来增加版本查询页面、管理后台和发布审计。

先创建 `db/migrations/001_init.sql`：

```
-- 内容主表：存放内容元数据，不替代 Git 中的 Markdown。
CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,            -- D1 使用 TEXT 存储 UUID
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL      -- article | video | resource
        CHECK (content_type IN ('article', 'video', 'resource')),
    summary TEXT,
    cover_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived')),
    source_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contents_type_status
    ON contents (content_type, status);

CREATE INDEX IF NOT EXISTS idx_contents_updated_at
    ON contents (updated_at DESC);

-- 正式发布记录：每次成功部署产生一条记录。
CREATE TABLE IF NOT EXISTS deployments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_version TEXT NOT NULL UNIQUE,
    git_sha TEXT NOT NULL,
    pages_deployment_id TEXT NOT NULL,  -- Cloudflare Pages 部署 ID
    status TEXT NOT NULL               -- deploying | success | failed | rolled_back
        CHECK (status IN ('deploying', 'success', 'failed', 'rolled_back')),
    deployed_at TEXT,
    finished_at TEXT,
    triggered_by TEXT,
    release_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_deployments_history
    ON deployments (deployed_at DESC);

-- 可选：记录发布前后的状态变化。
CREATE TABLE IF NOT EXISTS deployment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deployment_id INTEGER NOT NULL
        REFERENCES deployments(id),
    event_type TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '{}',  -- JSON 字符串存储
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 每个站点一个当前版本指针。
CREATE TABLE IF NOT EXISTS site_current_release (
    site_key TEXT PRIMARY KEY,
    deployment_id INTEGER NOT NULL REFERENCES deployments(id),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

这里有一个需要注意的地方：`deployments` 只记录发布事件，不是完整的文件备份。真正恢复历史网站时，必须保留对应的 Git commit 和 Cloudflare Pages 部署快照。

### 4.1 表结构总览

| 表 | 角色 | 写入方 | 读取方 |
| --- | --- | --- | --- |
| `contents` | 内容元数据索引（Git 的物化视图） | CI：`sync-content-db.mjs` | 未来管理后台 / 搜索 |
| `deployments` | 每次发布的只追加日志 | CI：`record-deployment.mjs` | `/api/deployments` → `/history` 页 |
| `deployment_events` | 发布状态变化审计（预留） | 未来扩展 | 未来管理后台 |
| `site_current_release` | 当前线上版本指针（单行） | CI：`record-deployment.mjs` | 未来站点健康检查 |

### 4.2 字段设计要点

**contents**

- `id` 直接取 `slug`，不使用独立 UUID：内容的唯一身份就是 slug（文件名），`ON CONFLICT (slug)` 是幂等 upsert 的锚点。
- `status` 来自 Markdown frontmatter，Git 是唯一事实源；数据库不引入独立的发布状态机。
- `source_path` 保存仓库内相对路径（统一 `/` 分隔），便于从数据库反查 Markdown 源文件。
- `updated_at` 每次同步刷新，`created_at` 只在首次插入时写入。

**deployments**

- `release_version` 设 `UNIQUE` 约束，是幂等键：CI 重跑同一 tag 时使用 `ON CONFLICT DO NOTHING`，不会产生重复记录。
- `pages_deployment_id` 实际存储 Pages 的**不可变预览 URL**（如 `https://5cae30a0.my-creative-site.pages.dev`），一个字段同时充当部署标识和历史快照链接，`/history` 页的「预览该版本」直接用它。
- `git_sha` 存完整 40 位 SHA，配合 `release_version`（tag）可精确定位源码。
- `deployed_at` 存业务发布时间，`created_at` 是记录写入时间；两者在重试场景下会不同，查询展示用前者。
- `finished_at` / `triggered_by` / `release_notes` 为预留列，当前脚本不写，避免为假设需求增加复杂度。

**site_current_release**

- 单行表，`site_key` 固定为 `'production'`。与 `deployments.status` 分离：`status` 描述「这次部署本身是否成功」，指针描述「线上现在指向谁」。回滚操作只动指针，不改历史记录。

### 4.3 写入路径与一致性规则

```
内容同步（每次部署）
  content/**/*.md ──sync-content-db.mjs──> upsert by slug
                                        └> DELETE 差集（Git 中已删除的同步出库）

发布记录（部署成功后）
  wrangler pages deploy ──record-deployment.mjs──> deployments upsert (release_version)
                                                └> site_current_release 指针更新
                                                └> 失败时指数退避重试 3 次
```

三条一致性规则：

1. **contents 可随时重建**：它是 Git 的物化视图，删表重跑同步脚本即可恢复，不算数据事故。
2. **deployments 只追加不改**：发布历史是不可变事实，回滚产生新记录而不是修改旧记录。
3. **写入失败 ≠ 部署失败**：Pages 部署已成功而 D1 写入失败时，重试 + 告警，不自动回滚已上线站点。

### 4.4 演进预留

| 演进方向 | 支撑方式 |
| --- | --- |
| 浏览量 / 点赞等计数 | 新增 `content_stats` 表，不污染 contents（读写分离） |
| 发布审批 / 状态流转 | 启用 `deployment_events`，记录 deploying→success 各阶段 |
| 多环境（staging） | `site_current_release.site_key` 天然支持多指针 |
| 迁回自托管 PostgreSQL | DDL 均为标准 SQL 子集，仅需替换 `datetime('now')` 默认值与方言细节 |

### 4.5 规划表：互动数据（创作时间 / 观看数 / 评论答复）

现状是这三类数据分散在三处外部系统中：

| 数据 | 当前载体 | 局限 |
| --- | --- | --- |
| 创作时间 | Markdown frontmatter `date` | 已同步进 Git，但 contents 表尚无对应列，数据库侧不可查询 |
| 观看数 | 不蒜子（busuanzi）第三方计数 | 数据在别人手里，无法统计、无法迁移、服务停则清零 |
| 评论及答复 | Giscus（GitHub Discussions） | 依赖 GitHub 账号登录，数据在 Discussions 而非自有库 |

规划两张新表（**已于 v1.0.2 实施**，见 `db/migrations/002_interaction.sql` 与 `functions/api/stats|comments`）：

```sql
-- 内容互动计数：观看 / 点赞等高频写、低一致性的数据
CREATE TABLE IF NOT EXISTS content_stats (
    slug TEXT PRIMARY KEY REFERENCES contents(id),
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 自有评论：评论与答复（楼中楼一级回复足够）
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL REFERENCES contents(id),
    parent_id INTEGER REFERENCES comments(id),   -- NULL=顶层评论，否则为答复
    author_name TEXT NOT NULL,
    author_contact TEXT,                          -- 可选，邮箱/主页
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published'      -- 即录即显；改 'pending' 即先审后发
        CHECK (status IN ('pending', 'published', 'rejected')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments (slug, status, created_at);
```

设计要点：

- **读写分离**：`content_stats` 是高频更新表，与 `contents`（同步重建的物化视图）分开，避免内容同步时计数被覆盖；slug 外键保证内容删除时可级联清理。
- **创作时间的归宿**：不建独立字段表，而是给 `contents` 加 `published_at` 列（来自 frontmatter `date`），同步脚本一并写入——静态事实归 Git/contents，动态计数归 content_stats。
- **评论简化策略（当前实现）**：即录即显，`status` 默认 `'published'`；预留屏蔽能力——把表默认值改为 `'pending'` 即切换为先审后发，前端 GET 只查 published，待审评论自动隐藏。答复通过 `parent_id` 单级关联，不做无限嵌套。
- **访客身份**：无需填写昵称。前端在 localStorage 生成持久 `visitor_id`（8 位十六进制），服务端据此分配显示名「访客_xxxxxxxx」；vid 缺失或非法时服务端随机兜底。同一浏览器的评论身份保持连续。
- **观看数去重**：服务端不强校验，前端 sessionStorage 保证每会话每篇只计一次；内容尚未同步入库时计数接口返回 202 降级，不影响阅读。
- **历史 Giscus 评论**：自建评论上线后 Giscus 已移除，历史评论保留在 GitHub Discussions 存档，不迁移。
- **后续增强（未实施）**：垃圾评论攻防（Cloudflare Turnstile）、审核界面、答复邮件通知——按需迭代。

### 发布历史数据示例

| 版本       | Git commit | 状态      | 用途      |
| -------- | ---------- | ------- | ------- |
| `v1.0.0` | `a13f9c2`  | success | 第一版正式上线 |
| `v1.1.0` | `d48b1e7`  | success | 调整首页九宫格 |
| `v1.2.0` | `f72c6a1`  | success | 增加资源分享页 |

正式版本应同时保存完整 commit SHA 和 Cloudflare Pages 部署 ID。每次 `git push` 到 main 分支后，Cloudflare Pages 会自动创建一个不可变部署快照，可通过部署 ID 或预览 URL 访问历史版本。

另外，数据库的 `status` 字段表示部署记录的状态，而 `site_current_release` 表表示当前线上指向哪个版本。两者不要混用：一个版本可能发布过，后来又被回滚。

## 五、Cloudflare Pages + D1 部署配置

部署建议分成两个独立部分：

- 静态站点：Astro 构建产物直接托管在 Cloudflare Pages，由全球 CDN 分发，无需维护服务器。
- 数据库：Cloudflare D1 保存发布记录和内容元数据，通过 Pages Functions 提供只读 API。

初期不用为网站的每次访问启动后端进程。以后需要浏览器直接查看数据库中的发布历史时，通过 Pages Functions 提供只读 API 服务；也可以先由 CI 生成静态历史页面。

### 5.1 Astro 构建配置

文件：`astro.config.mjs`

```
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  adapter: undefined,  // 纯静态输出，Pages Functions 单独处理 API
  build: {
    format: 'directory',
  },
});
```

Astro 输出纯静态文件到 `dist/` 目录，Cloudflare Pages 直接托管该目录。Pages Functions 放在项目根目录的 `functions/` 文件夹中，自动映射为 API 路由。

### 5.2 Pages Functions：发布历史 API

文件：`functions/api/deployments.ts`

```
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { results } = await context.env.DB
    .prepare('SELECT * FROM deployments ORDER BY deployed_at DESC LIMIT 50')
    .all();

  return Response.json(results);
};
```

Pages Functions 自动绑定 D1 数据库，无需额外配置后端服务。该接口提供只读的发布历史查询，前端可在版本档案页面调用。

### 5.3 Cloudflare 配置文件

文件：`wrangler.toml`

```
name = "my-creative-site"
compatibility_date = "2026-10-01"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "creative-site-db"
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```

`wrangler.toml` 用于本地开发时绑定 D1 数据库以及部署时的资源配置。实际使用时需要先通过 `npx wrangler d1 create creative-site-db` 创建数据库，并将返回的 `database_id` 填入。

### 5.4 D1 数据库初始化

创建并执行数据库迁移：

```
# 创建 D1 数据库
npx wrangler d1 create creative-site-db

# 执行迁移
npx wrangler d1 execute creative-site-db --file=db/migrations/001_init.sql

# 本地开发时执行迁移到本地 D1
npx wrangler d1 execute creative-site-db --local --file=db/migrations/001_init.sql
```

说明：

- Cloudflare Pages 在免费计划中提供每月 500 次构建、无限的请求和带宽。
- D1 免费计划包含 5GB 存储、每天 500 万次读取，足够产品初期使用。
- Pages Functions 免费计划包含每天 10 万次请求调用。
- D1 的 SQL 迁移不会自动执行，每次变更需要手动通过 `wrangler` 命令行执行。
- 生产环境数据库变更应先在本地 D1 测试，确认无误后再执行到远程。

### 5.5 环境变量与 Secrets

在 Cloudflare Dashboard → Pages 项目 → Settings → Environment variables 中配置：

| 变量              | 用途                         |
| ----------------- | ---------------------------- |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions 部署时使用的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID           |

注意：API Token 应在 GitHub 仓库的 Secrets 中存储，不要提交到代码仓库。Token 权限应限制为 `Cloudflare Pages:Edit` 和 `D1:Edit`。

## 六、发布记录脚本

Cloudflare Pages 部署由 GitHub Actions 调用 `wrangler` CLI 完成，部署成功后通过 Pages API 获取部署 ID，再通过 D1 记录发布版本。这里不需要服务器端的部署脚本，所有逻辑在 CI 中完成。

文件：`scripts/record-deployment.mjs`

```
#!/usr/bin/env node

/**
 * 将部署成功后的版本信息写入 Cloudflare D1 数据库。
 * 用法: node scripts/record-deployment.mjs <version> <git_sha> <pages_deployment_id>
 */

const D1_DATABASE_NAME = 'creative-site-db';

async function main() {
  const [version, gitSha, pagesDeploymentId] = process.argv.slice(2);

  if (!version || !gitSha || !pagesDeploymentId) {
    console.error('Usage: record-deployment.mjs <version> <git_sha> <pages_deployment_id>');
    process.exit(1);
  }

  // 格式校验，防止注入。
  if (!/^[a-zA-Z0-9._-]+$/.test(version)) { console.error('Invalid version'); process.exit(2); }
  if (!/^[a-f0-9]{40}$/.test(gitSha)) { console.error('Invalid git sha'); process.exit(2); }
  if (!/^[a-f0-9-]+$/.test(pagesDeploymentId)) { console.error('Invalid deployment id'); process.exit(2); }

  const sql = `INSERT INTO deployments (release_version, git_sha, pages_deployment_id, status, deployed_at, finished_at)
               VALUES ('${version}', '${gitSha}', '${pagesDeploymentId}', 'success', datetime('now'), datetime('now'))
               ON CONFLICT (release_version) DO NOTHING;`;

  const { execSync } = await import('child_process');
  execSync(
    `npx wrangler d1 execute ${D1_DATABASE_NAME} --command "${sql.replace(/"/g, '\\"')}" --remote`,
    { stdio: 'inherit' }
  );

  console.log(`Release ${version} recorded: ${gitSha}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

这份脚本在 CI 中通过 `wrangler` CLI 直接操作 D1 数据库。正式投入使用前，还需要处理以下边界情况：

- 部署开始时先记录 `deploying` 状态。
- 部署成功后更新为 `success`，并更新 `site_current_release` 指针。
- 部署失败时更新为 `failed`。
- 回滚时单独记录回滚事件，不覆盖原来的成功发布记录。

注意：D1 的 SQL 执行通过 `wrangler` CLI 远程调用，确保 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` 环境变量已在 CI 中配置。

## 七、GitHub Actions：提交后自动上线

推荐发布机制是：

1. GitHub Actions 检查 Markdown 和项目代码。
2. 构建静态站点。
3. 通过 `wrangler` CLI 部署到 Cloudflare Pages。
4. 获取 Pages 部署 ID。
5. 记录发布版本到 Cloudflare D1。

GitHub Actions 的 `production` Environment 可以限制允许部署的分支、保护部署密钥，也可以在正式上线前设置人工审批。

[image](https://www.google.com/s2/favicons?domain=https://docs.github.com\&sz=32)

GitHub Docs

+1



### 7.1 配置 GitHub Secrets

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中配置：

| Secret                    | 用途                              |
| ------------------------- | --------------------------------- |
| `CLOUDFLARE_API_TOKEN`    | Cloudflare API Token（Pages + D1 权限） |
| `CLOUDFLARE_ACCOUNT_ID`   | Cloudflare 账户 ID                |

无需配置 SSH 密钥或镜像仓库凭据。Cloudflare API Token 权限应限制为 `Cloudflare Pages:Edit` 和 `D1:Edit`，不要使用全局权限的 Token。

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

concurrency:
  group: production-deploy
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment: production
    outputs:
      version: ${{ steps.meta.outputs.version }}
      sha: ${{ steps.meta.outputs.sha }}
      deployment_id: ${{ steps.deploy.outputs.deployment_id }}

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

      - name: Set metadata
        id: meta
        shell: bash
        run: |
          echo "sha=${GITHUB_SHA}" >> "$GITHUB_OUTPUT"

          if [[ "$GITHUB_REF" == refs/tags/v* ]]; then
            VERSION="${GITHUB_REF_NAME}"
          else
            VERSION="build-${GITHUB_RUN_NUMBER}"
          fi

          echo "version=${VERSION}" >> "$GITHUB_OUTPUT"

      - name: Deploy to Cloudflare Pages
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=my-creative-site

      - name: Record deployment to D1
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          node scripts/record-deployment.mjs \
            "${{ steps.meta.outputs.version }}" \
            "${{ steps.meta.outputs.sha }}" \
            "${{ steps.deploy.outputs.deployment_id }}"
```

这份配置是实施模板，落地前要确认 `package.json` 中存在 `check` 和 `build` 命令，并确认 Cloudflare Pages 项目已创建。

另外有两点需要特别处理：

- 将 `my-creative-site` 改成实际的 Cloudflare Pages 项目名。
- 正式生产建议将 Actions 引用固定到经过审查的完整 commit SHA，而不是长期依赖可变的版本标签；首次部署也应先在测试环境验证 Cloudflare Pages 项目配置和 D1 迁移。

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

CI 配置在部署到 Cloudflare Pages 成功后，通过 `scripts/record-deployment.mjs` 脚本将发布信息写入 D1。核心 SQL 如下：

```
INSERT INTO deployments (
    release_version,
    git_sha,
    pages_deployment_id,
    status,
    deployed_at,
    finished_at
)
VALUES (
    'v1.1.0',
    'd48b1e7...',
    'abc123-deployment-id',
    'success',
    datetime('now'),
    datetime('now')
)
ON CONFLICT (release_version)
DO NOTHING;
```

需要注意：这里的 `ON CONFLICT DO NOTHING` 适合版本号唯一且不重复发布的策略。如果需要重复部署同一版本，应该采用独立的部署流水线 ID 作为唯一键，而不是静默忽略记录。

生产实现还应做到：

- 部署开始时通过 `wrangler d1 execute` 记录 `deploying`。
- Cloudflare Pages 部署成功后更新为 `success`。
- 部署失败时更新为 `failed`。
- 回滚时单独记录回滚事件，不覆盖原来的成功发布记录。
- 只有 Pages 部署成功后，才更新当前线上版本指针。

数据库记录失败时，也不能简单地把已经上线的网站视为部署失败并自动恢复旧版本。更合理的方式是重试记录操作、保留本次部署信息并告警。D1 的写入操作有重试机制，建议在脚本中加入最多 3 次的指数退避重试。

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
- 恢复历史：通过管理操作重新部署指定的历史版本，并将这次回滚作为新的部署事件记录。

### 历史版本预览怎么实现？

Cloudflare Pages 会为每次部署自动生成一个不可变的预览 URL，历史预览可以有两种方式：

1. 简单方案： 通过 Cloudflare Pages 的部署历史面板直接查看每次部署的预览 URL，或通过 D1 中记录的部署 ID 查询。GitHub Release 和 commit 也可以辅助回看版本信息。
2. 进阶方案： 利用 Cloudflare Pages 每次部署生成的 `<hash>.my-creative-site.pages.dev` 预览 URL，在版本档案页面中展示历史预览链接，用户点击即可访问对应版本的完整站点。

第二种方案更适合你希望长期积累个人创作档案的目标。Cloudflare Pages 天然保留每次部署的预览 URL，无需额外维护容器或反向代理，资源路径、旧页面链接均由预览 URL 天然隔离。

## 十、从零部署的实施顺序

## 实施清单

0/7 已完成

初始化项目

创建 Astro + TypeScript 项目，完成首页和三类内容模板。

建立内容规范

定义 Frontmatter schema、Markdown 目录和图片引用规则。

创建 GitHub 私有仓库

提交源码，配置 main 分支保护和 Actions。

创建 Cloudflare 资源

创建 Pages 项目、D1 数据库、R2 存储桶，执行 D1 迁移。

配置 CI/CD

配置 Cloudflare API Token、GitHub Secrets、部署工作流。

接入发布历史

通过 Pages Functions 查询 D1，在版本档案页面展示发布记录。

验证回滚和备份

模拟构建失败、部署失败、D1 数据备份恢复及 Cloudflare Pages 历史版本回滚。

D1 数据库备份建议使用 `npx wrangler d1 export creative-site-db --output backup.sql` 定期导出，并将备份文件存储到 R2 或本地；正式部署前要实际演练恢复。Cloudflare Pages 天然保留每次部署的快照，可在 Dashboard 中一键回滚到任意历史版本。

## 十一、最终建议

先不要急着开发复杂的管理后台。第一阶段把下面这条链路跑通：

本地 Markdown → GitHub 私有仓库 → Actions 构建静态站点 → Cloudflare Pages 部署 → D1 记录发布历史。

当这条链路稳定后，再开发版本档案页面、历史预览、后台检索和一键回滚。这样既能快速上线，也能避免未来因为内容管理和部署耦合而重构整个系统。

参考文档：

- [Astro 内容集合](https://docs.astro.build/en/guides/content-collections/?utm_source=chatgpt.com)
- [GitHub Actions 文档](https://docs.github.com/en/actions?utm_source=chatgpt.com)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/?utm_source=chatgpt.com)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/?utm_source=chatgpt.com)