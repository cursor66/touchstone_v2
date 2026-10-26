-- 互动数据：观看计数 + 自有评论
-- 用法：npx wrangler d1 execute creative-site-db --remote --file=db/migrations/002_interaction.sql
-- 本地：npx wrangler d1 execute creative-site-db --local --file=db/migrations/002_interaction.sql

-- 内容互动计数：高频写，与 contents（Git 物化视图）读写分离
CREATE TABLE IF NOT EXISTS content_stats (
    slug TEXT PRIMARY KEY REFERENCES contents(id),
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 自有评论：评论与答复（parent_id 单级关联）
-- status 默认 'published'（即录即显）；如需先审后发，改为 'pending' 即可整体屏蔽待审
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL REFERENCES contents(id),
    parent_id INTEGER REFERENCES comments(id),
    author_name TEXT NOT NULL,
    author_contact TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published'
        CHECK (status IN ('pending', 'published', 'rejected')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_slug
    ON comments (slug, status, created_at);
