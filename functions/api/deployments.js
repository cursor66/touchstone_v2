/**
 * Pages Function：发布历史只读 API
 * GET /api/deployments → 最近 50 条成功发布记录（时间倒序）
 * D1 绑定名 DB 见 wrangler.toml。
 */
export async function onRequestGet(context) {
  const { results } = await context.env.DB
    .prepare(
      `SELECT release_version, git_sha, pages_deployment_id, status, deployed_at, release_notes
       FROM deployments
       WHERE status = 'success'
       ORDER BY deployed_at DESC
       LIMIT 50`,
    )
    .all();

  return Response.json(results, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
