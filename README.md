# 心之所向 · 个人技术分享网站

以 Markdown 为内容源、Astro 静态生成、GitHub Actions 自动构建、1Panel + Docker Compose 运行、PostgreSQL 记录发布历史的个人内容平台。本地创作完成后，一次 `git push` 即可自动上线，并可随时回看历次发布版本。

- 前端：Astro 5 + TypeScript + Tailwind CSS 3
- 内容：Markdown + YAML Frontmatter（Git 管理版本）
- 部署：GitHub Actions → GHCR → 1Panel（Nginx + Docker Compose + PostgreSQL）

## 快速开始

```bash
npm install
npm run dev        # 本地开发（含 /design-system 设计系统预览页）
npm run check      # 内容校验 + 类型检查
npm run build      # 构建静态站点到 dist/
npm run preview    # 本地预览构建产物
```

## 目录结构

```
├── src/
│   ├── components/        # 全部可复用组件（见「组件复用规范」）
│   │   ├── ui/            #   基础元素：Button / Icon / SearchInput / Select
│   │   ├── cards/         #   卡片：ContentCard / SeriesCard
│   │   ├── layout/        #   结构：Header / Footer / SectionHeading
│   │   │                  #   页面模板：CollectionPage（列表）/ ContentDetail（详情）
│   │   └── home/          #   首页模块：HeroCarousel
│   ├── layouts/           # BaseLayout（唯一 HTML 骨架）
│   ├── pages/             # 路由页面（只组合组件，不堆样式）
│   ├── data/              # 站点信息 / Hero slides / 系列专题等静态数据
│   ├── styles/            # global.css（Tailwind 入口 + 全局 token + 正文排版）
│   ├── utils/             # getAllContent 等内容查询
│   └── content.config.ts  # 内容集合 schema（构建期校验 Frontmatter）
├── content/               # Markdown 内容：articles / videos / resources
├── db/migrations/         # PostgreSQL DDL（发布历史与内容索引）
├── deploy/                # Dockerfile / nginx.conf / compose.yaml / deploy.sh
├── scripts/               # validate-content.mjs / release.sh
└── .github/workflows/     # deploy.yml（推送后自动构建部署）
```

## 设计系统架构

设计系统完整还原自设计稿（`temp/` 参考页面），分为四层，下层变更自动传导到所有页面：

### 1. 设计 Token（tailwind.config.mjs + global.css）

| 类别 | 取值 |
| --- | --- |
| 主色 | `blue-600`（Logo、主按钮、链接、强调条） |
| 辅色 | `emerald-600`（成长主题）、`orange-600`（影像主题） |
| 页面背景 | `gray-50`；深色区域 `slate-900`（页脚） |
| 文字层级 | 标题 `gray-900` / 正文 `gray-700/600` / 次要 `gray-500` / 辅助 `gray-400` |
| 字体 | `Noto Sans SC`（300/400/500/700），全局 `font-sans` |
| 圆角 | 按钮/下拉 `rounded-md`、Logo `rounded-lg`、卡片 `rounded-xl`、专题卡 `rounded-2xl`、搜索/头像 `rounded-full` |
| 阴影 | 卡片默认 `shadow-sm`，hover `shadow-md`；专题卡 hover `shadow-lg` |
| 渐变 | 专题卡 `from-{color}-50 to-{adjacent}-50` + `border-{color}-100` |
| 容器 | 页面 `max-w-7xl`、内容 `max-w-5xl`、详情正文 `max-w-2xl`，均 `mx-auto px-4` |
| 间距 | 区块 `py-12`、标题区 `mb-8`、卡片网格 `gap-6`、专题网格 `gap-8` |
| 动效 | `transition` 150ms；轮播 `duration-700`；hover 图标 `scale-110` / 箭头 `translate-x-1` |

### 2. 基础组件（components/ui/）

`Button`（variant: primary/secondary/ghost）、`Icon`（20 个内联 SVG 图标）、`SearchInput`、`Select`。

### 3. 复合组件（components/cards/ + components/layout/）

- `ContentCard`：文章/视频/资源三种类型共用的内容卡片，`type="video"` 自动显示悬浮播放按钮。
- `SeriesCard`：系列专题渐变卡片，`color` 一键切换 blue/emerald/orange 整套配色。
- `SectionHeading`：蓝色竖条区块标题（可选「查看全部」链接）。
- `Header` / `Footer`：全局导航与深色页脚。
- `CollectionPage`：三个列表页共用的页面模板。
- `ContentDetail`：三个详情页共用的页面模板（按类型渲染观看/下载按钮）。

### 4. 页面（pages/）

页面只负责取数与组合组件，**不允许出现页面级私有样式**。首页九宫格数据来自 `content/` 三个内容集合的混排（`getAllContent()`）。

### 设计系统预览页

开发环境访问 `/design-system`，可查看颜色、字体、按钮、圆角、表单、卡片、图标与布局规范的实际渲染效果（生产构建下自动重定向到首页）。

## 组件复用规范（必须遵守）

1. **开发页面时，必须优先复用已有组件**，先看 `src/components/` 里有没有可直接使用的。
2. **已有组件可通过 props / variant / className 扩展时，优先扩展**，而不是重新创建相似组件：
   - 按钮换样式 → `Button` 加 `variant` 或传 `class`，不要新建 `XxxButton.astro`。
   - 卡片换配色 → 给 `SeriesCard` 的 `palette` 加一条记录，不要新建卡片。
   - 新图标 → 在 `Icon.astro` 的 `paths` 中补充，不要内联散落的 SVG。
3. **只有现有组件无法满足需求时，才新增组件**，并放到对应层级目录（ui / cards / layout）。
4. 页面中禁止重复堆叠样式：同一段 class 组合出现两次以上，就应下沉为组件或提取到组件 props。
5. Tailwind 类名必须静态可扫描，禁止运行时拼接（如 `` `bg-${color}-600` ``）；动态配色参考 `SeriesCard` 的 palette 映射写法。

## 内容创作

在 `content/articles|videos|resources/` 下新建 Markdown：

```markdown
---
title: "YOLO26 ONNX 推理实践"
type: "article"            # article | video | resource
date: 2026-10-19
summary: "从模型导出到 ONNX Runtime 部署。"
cover: "https://…/cover.webp"
tags: [AI, ONNX]
status: "published"        # draft | published | archived
videoUrl: "…"              # 仅 video 需要
downloadUrl: "…"           # 仅 resource 需要
githubUrl: "…"             # 仅 resource 可选
---

正文……
```

- URL 使用稳定的文件名 slug（如 `/articles/yolo26-onnx/`），不要依赖标题或日期。
- `npm run check` 会在本地与 CI 校验必填字段、取值范围与日期格式。

## 发布与部署

```bash
git add content/ src/
git commit -m "feat: publish YOLO26 ONNX article"
git push origin main           # 自动构建镜像并部署（build-N 版本）

./scripts/release.sh v1.0.0    # 打 tag 发布正式版本
```

CI 流程（`.github/workflows/deploy.yml`）：内容校验 → 构建 → 推送 GHCR 镜像 → 生成内容索引 SQL 并上传 → SSH 到 1Panel 服务器执行 `deploy/deploy.sh` → 健康检查 → 写入 PostgreSQL `deployments` 表 → 失败自动回滚镜像配置。

服务器侧需在 `/opt/creative-site/` 放置 `compose.yaml` 与 `.env.production`（参考 `deploy/.env.production.example`），数据库首次启动自动执行 `db/migrations/001_init.sql`；`deployments` 只记录发布事件，恢复历史版本依赖保留的 Git commit 与镜像。

### PostgreSQL 数据链路

- **内容索引**：`scripts/sync-content-db.mjs` 扫描 `content/` 生成幂等 upsert SQL（本地可运行 `node scripts/sync-content-db.mjs > contents.sql` 预览），CI 上传服务器后由 `deploy.sh` 写入 `contents` 表，与 Git 中 Markdown 保持一致（含已删除内容的清理）。
- **发布记录**：每次部署成功写入 `deployments` 表一条记录（版本号 / commit SHA / 镜像引用 / 时间）。
- **版本元数据读取**：部署成功后 `deploy.sh` 将最近 50 条成功发布导出为 `/opt/creative-site/data/history.json`，经 compose bind mount 由 nginx 以 `/data/history.json` 静态提供；`/history` 版本档案页客户端拉取渲染，无需运行时数据库连接。
