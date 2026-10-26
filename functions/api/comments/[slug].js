/**
 * 自有评论 API：GET 列出某内容的已发布评论（含答复），POST 记录一条评论/答复。
 * 简化策略：即录即显（status 默认 published，由表默认值决定）；
 * 预留屏蔽：把表默认改为 'pending' 或将 GET 的过滤条件改掉即可切换为先审后发。
 * 访客标识：无需填写昵称，前端生成持久 visitor id（vid），服务端分配显示名「访客_xxxxxxxx」。
 */

const SLUG_RE = /^[\w-]{1,100}$/;
const VID_RE = /^[a-f0-9]{8}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** 合法的 vid 直接使用；缺失/非法时随机分配 */
function resolveAuthor(vid) {
  const id = VID_RE.test(String(vid ?? ''))
    ? String(vid)
    : [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `访客_${id}`;
}

export async function onRequestGet({ env, params }) {
  const slug = params.slug;
  if (!SLUG_RE.test(slug)) return json({ error: 'invalid slug' }, 400);
  const { results } = await env.DB.prepare(
    `SELECT id, parent_id, author_name, body, created_at
     FROM comments
     WHERE slug = ? AND status = 'published'
     ORDER BY created_at ASC, id ASC`,
  ).bind(slug).all();
  return json(results ?? []);
}

export async function onRequestPost({ env, request, params }) {
  const slug = params.slug;
  if (!SLUG_RE.test(slug)) return json({ error: 'invalid slug' }, 400);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const body = String(payload.body ?? '').trim();
  const parentId = payload.parent_id == null ? null : Number(payload.parent_id);
  const author = resolveAuthor(payload.vid);

  if (!body || body.length > 1000) return json({ error: '评论必填且不超过 1000 字' }, 400);
  if (parentId != null && (!Number.isInteger(parentId) || parentId <= 0)) {
    return json({ error: 'invalid parent_id' }, 400);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO comments (slug, parent_id, author_name, body) VALUES (?, ?, ?, ?)`,
    ).bind(slug, parentId, author, body).run();
  } catch {
    return json({ error: '内容不存在或答复目标无效' }, 409);
  }
  return json({ ok: true, author }, 201);
}
