/**
 * 观看计数 API：POST 累加一次，GET 读取当前值。
 * 前端按 sessionStorage 去重（每会话每篇只计一次），服务端不做强校验。
 */

const SLUG_RE = /^[\w-]{1,100}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestGet({ env, params }) {
  const slug = params.slug;
  if (!SLUG_RE.test(slug)) return json({ error: 'invalid slug' }, 400);
  const row = await env.DB.prepare(
    'SELECT views FROM content_stats WHERE slug = ?',
  ).bind(slug).first();
  return json({ slug, views: row?.views ?? 0 });
}

export async function onRequestPost({ env, params }) {
  const slug = params.slug;
  if (!SLUG_RE.test(slug)) return json({ error: 'invalid slug' }, 400);
  try {
    await env.DB.prepare(
      `INSERT INTO content_stats (slug, views) VALUES (?, 1)
       ON CONFLICT(slug) DO UPDATE SET views = views + 1, updated_at = datetime('now')`,
    ).bind(slug).run();
  } catch {
    // 内容尚未同步入库（新文章未部署）时计数丢弃，不影响阅读
    return json({ slug, views: null, deferred: true }, 202);
  }
  const row = await env.DB.prepare(
    'SELECT views FROM content_stats WHERE slug = ?',
  ).bind(slug).first();
  return json({ slug, views: row?.views ?? 1 }, 201);
}
