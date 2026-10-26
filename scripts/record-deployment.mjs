#!/usr/bin/env node

/**
 * 将部署成功后的版本信息写入 Cloudflare D1 数据库。
 * 用法: node scripts/record-deployment.mjs <version> <git_sha> <pages_deployment_id> [triggered_by]
 * 需要在环境中提供 CLOUDFLARE_API_TOKEN 与 CLOUDFLARE_ACCOUNT_ID（CI Secrets）。
 * 写入内容：
 *  1. deployments 插入一条 success 记录（release_version 幂等）
 *  2. site_current_release 指针更新到该版本
 * 失败时最多重试 3 次（指数退避）。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const D1_DATABASE_NAME = 'creative-site-db';

const [version, gitSha, pagesDeploymentId, triggeredBy = 'github-actions'] = process.argv.slice(2);

if (!version || !gitSha || !pagesDeploymentId) {
  console.error('Usage: record-deployment.mjs <version> <git_sha> <pages_deployment_id> [triggered_by]');
  process.exit(1);
}

// 格式校验，防止注入
if (!/^[a-zA-Z0-9._/-]+$/.test(version)) { console.error('Invalid version'); process.exit(2); }
if (!/^[a-f0-9]{7,40}$/.test(gitSha)) { console.error('Invalid git sha'); process.exit(2); }
// Pages 部署标识（deployment URL，如 https://<hash>.my-creative-site.pages.dev，同时作为历史预览链接）
if (!/^[a-zA-Z0-9.:/_-]+$/.test(pagesDeploymentId)) { console.error('Invalid deployment id'); process.exit(2); }

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

const sql = [
  `INSERT INTO deployments (release_version, git_sha, pages_deployment_id, status, deployed_at, finished_at, triggered_by)
   VALUES (${q(version)}, ${q(gitSha)}, ${q(pagesDeploymentId)}, 'success', datetime('now'), datetime('now'), ${q(triggeredBy)})
   ON CONFLICT (release_version) DO NOTHING;`,
  `INSERT INTO site_current_release (site_key, deployment_id, updated_at)
   SELECT 'production', id, datetime('now') FROM deployments WHERE release_version = ${q(version)}
   ON CONFLICT (site_key) DO UPDATE SET
     deployment_id = excluded.deployment_id,
     updated_at = datetime('now');`,
].join('\n');

const sqlFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'd1-record-')), 'record.sql');
fs.writeFileSync(sqlFile, sql);

const cmd = `npx wrangler d1 execute ${D1_DATABASE_NAME} --remote --file="${sqlFile}"`;

let lastErr;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Release ${version} recorded: ${gitSha} (${pagesDeploymentId})`);
    process.exit(0);
  } catch (err) {
    lastErr = err;
    console.error(`Record attempt ${attempt} failed${attempt < 3 ? ', retrying...' : ''}`);
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
  }
}
console.error(lastErr);
process.exit(1);
