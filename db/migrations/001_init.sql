-- Cloudflare D1 (SQLite) 初始化迁移
-- 用法：npx wrangler d1 execute creative-site-db --remote --file=db/migrations/001_init.sql
-- 本地：npx wrangler d1 execute creative-site-db --local --file=db/migrations/001_init.sql

-- 内容主表：存放内容元数据，不替代 Git 中的 Markdown。
CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL
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
    pages_deployment_id TEXT NOT NULL,
    status TEXT NOT NULL
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
    details TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 每个站点一个当前版本指针。
CREATE TABLE IF NOT EXISTS site_current_release (
    site_key TEXT PRIMARY KEY,
    deployment_id INTEGER NOT NULL REFERENCES deployments(id),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
