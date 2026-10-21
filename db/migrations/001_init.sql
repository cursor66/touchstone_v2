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
