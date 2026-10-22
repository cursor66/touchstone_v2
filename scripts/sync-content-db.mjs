/**
 * 内容索引同步：扫描 content/ 下所有 Markdown，生成幂等 SQL（stdout），
 * 将内容元数据 upsert 进 PostgreSQL contents 表。
 * 用法：node scripts/sync-content-db.mjs > contents.sql
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

/** 简单 YAML Frontmatter 解析（与 validate-content.mjs 保持一致） */
function parseFrontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return data;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });
}

/** SQL 字符串字面量转义 */
const q = (v) => (v == null || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

const rows = [];

for (const type of ['articles', 'videos', 'resources']) {
  for (const file of walk(path.join(CONTENT_DIR, type))) {
    const fm = parseFrontmatter(file);
    if (!fm) continue;
    const slug = path.basename(file, '.md');
    rows.push({
      slug,
      title: fm.title,
      content_type: fm.type,
      summary: fm.summary,
      cover_url: fm.cover,
      status: fm.status || 'draft',
      source_path: path.relative(ROOT, file).replace(/\\/g, '/'),
    });
  }
}

console.log('-- 由 scripts/sync-content-db.mjs 生成，请勿手改');
console.log('BEGIN;');
for (const r of rows) {
  console.log(
    `INSERT INTO contents (slug, title, content_type, summary, cover_url, status, source_path, updated_at)\n` +
      `VALUES (${q(r.slug)}, ${q(r.title)}, ${q(r.content_type)}, ${q(r.summary)}, ${q(r.cover_url)}, ${q(r.status)}, ${q(r.source_path)}, NOW())\n` +
      `ON CONFLICT (slug) DO UPDATE SET\n` +
      `  title = EXCLUDED.title,\n` +
      `  content_type = EXCLUDED.content_type,\n` +
      `  summary = EXCLUDED.summary,\n` +
      `  cover_url = EXCLUDED.cover_url,\n` +
      `  status = EXCLUDED.status,\n` +
      `  source_path = EXCLUDED.source_path,\n` +
      `  updated_at = NOW();`,
  );
}
// 删除库中存在但 Git 中已移除的内容索引
console.log(
  `DELETE FROM contents WHERE slug NOT IN (${rows.map((r) => q(r.slug)).join(', ') || "''"});`,
);
console.log('COMMIT;');
console.error(`已生成 ${rows.length} 条内容索引 SQL`);
