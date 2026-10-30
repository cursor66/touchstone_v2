/**
 * 内容校验：构建前检查 content/ 下所有 Markdown 的 Frontmatter
 * 必填字段（title/type/date/summary/cover/status）与取值范围，
 * 让错误在 CI 阶段暴露，而不是上线后才发现。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

const REQUIRED = ['title', 'type', 'date', 'summary', 'cover', 'status'];
const TYPES = ['article', 'video', 'resource'];
const STATUSES = ['draft', 'published', 'archived'];

function parseFrontmatter(file) {
  // 统一换行符（Windows autocrlf），并去除 UTF-8 BOM（部分编辑器写入时附带）
  const text = fs.readFileSync(file, 'utf8').replace(/﻿/, '').replace(/\r\n/g, '\n');
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
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });
}

let errors = 0;

for (const file of walk(CONTENT_DIR)) {
  const rel = path.relative(ROOT, file);
  const fm = parseFrontmatter(file);
  if (!fm) {
    console.error(`✗ ${rel}: 缺少 Frontmatter`);
    errors++;
    continue;
  }
  for (const key of REQUIRED) {
    if (!fm[key]) {
      console.error(`✗ ${rel}: 缺少必填字段 ${key}`);
      errors++;
    }
  }
  if (fm.type && !TYPES.includes(fm.type)) {
    console.error(`✗ ${rel}: type 必须是 ${TYPES.join(' / ')}，当前为 "${fm.type}"`);
    errors++;
  }
  if (fm.status && !STATUSES.includes(fm.status)) {
    console.error(`✗ ${rel}: status 必须是 ${STATUSES.join(' / ')}，当前为 "${fm.status}"`);
    errors++;
  }
  if (fm.date && Number.isNaN(Date.parse(fm.date))) {
    console.error(`✗ ${rel}: date 无法解析 "${fm.date}"`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n内容校验失败：共 ${errors} 个问题`);
  process.exit(1);
}

console.log('内容校验通过');
