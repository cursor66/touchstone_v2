# 部署前检查清单（Cloudflare 版）

> 首次上线前按顺序逐项确认。对应架构文档 `architecture.md` 第十节。

## 一、Cloudflare 资源创建

- [ ] 注册 Cloudflare 账号，记录 **Account ID**（Dashboard 右侧栏）
- [ ] 创建 D1 数据库：`npx wrangler d1 create creative-site-db`
- [ ] 将返回的 `database_id` 填入 [wrangler.toml](wrangler.toml) 的 `database_id`
- [ ] 执行远程迁移：`npx wrangler d1 execute creative-site-db --remote --file=db/migrations/001_init.sql`
- [ ] （可选）本地迁移：`npx wrangler d1 execute creative-site-db --local --file=db/migrations/001_init.sql`
- [ ] 创建 API Token（My Profile → API Tokens）：权限限定 **Cloudflare Pages:Edit + D1:Edit**，不要全局 Token
- [ ] （可选）创建 R2 存储桶用于封面/图片/下载资源（初期内容封面用外链，可暂缓）

## 二、GitHub 配置

- [ ] 仓库 Settings → Secrets and variables → Actions 配置：
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] 仓库 Settings → Environments → `production` 环境已创建（可加分支限制/人工审批）

## 三、部署前本地验证

- [ ] `npm run check` 通过（内容校验 + 类型检查，0 errors）
- [ ] `npm run build` 成功（18 页）
- [ ] `node scripts/sync-content-db.mjs > contents.sql` 正常生成 SQL（应为 12 条 upsert + 1 条清理）
- [ ] 工作区干净：`git status` 无未提交改动，与 origin/main 同步

## 四、执行首次部署

- [ ] 打标签触发：`git tag v1.0.0 && git push origin v1.0.0`（或 Actions 页手动 workflow_dispatch）
- [ ] 观察 Actions：build（校验 → 构建）→ deploy（pages deploy → 同步内容索引 → record-deployment）
- [ ] 记录 deploy 步骤输出的 Pages 预览 URL（`<hash>.my-creative-site.pages.dev`）

> 首次 `pages deploy` 会自动创建 Pages 项目 `my-creative-site`。

## 五、部署后验证

- [ ] 站点可访问：`https://my-creative-site.pages.dev` 返回 200，样式与图片正常
- [ ] 内容索引已入库：`npx wrangler d1 execute creative-site-db --remote --command "SELECT content_type, COUNT(*) FROM contents GROUP BY 1"` 应为 article 7 / video 2 / resource 3
- [ ] 发布记录已写入：`SELECT release_version, git_sha, status FROM deployments ORDER BY deployed_at DESC LIMIT 3` 含 v1.0.0 / success
- [ ] 当前版本指针已更新：`SELECT * FROM site_current_release`
- [ ] API 可用：`https://my-creative-site.pages.dev/api/deployments` 返回 JSON 数组
- [ ] `/history` 页面显示真实发布卡片，且「预览该版本」链接可打开历史快照
- [ ] 首页工具栏（筛选 / 排序 / 搜索）在线环境功能正常
- [ ] 回滚预案：Cloudflare Dashboard → Pages 项目 → Deployments，对历史部署点「Rollback」即可一键回滚；回滚后手动执行 `record-deployment.mjs` 记录一条 `rolled_back` 事件

## 六、自定义域名（可选）

- [ ] Pages 项目 → Custom domains → 绑定域名，自动签发 HTTPS 证书
- [ ] DNS 按提示添加 CNAME 记录

## 七、运维常态

- [ ] D1 备份：定期 `npx wrangler d1 export creative-site-db --output backup.sql`，存 R2 或本地
- [ ] 恢复演练：在测试库 `npx wrangler d1 execute creative-site-db-test --local --file=backup.sql` 验证备份可用

## 常见坑

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| deploy 步骤 wrangler 认证失败 | Secrets 未配置或 Token 权限过大/过小 | 检查清单第一、二节 |
| `contents` 表为空 | 同步步骤未执行或 SQL 生成失败 | 查看 "Sync content index to D1" 日志 |
| `/api/deployments` 404/500 | D1 绑定未生效（database_id 占位未替换） | 填 wrangler.toml 后重新部署 |
| `/history` 显示空状态 | 尚无 success 发布记录或 API 不可达 | 先完成一次 tag 部署 |
| Validate content 全报「缺少 Frontmatter」 | CRLF 换行 | 已修复（脚本统一换行符 + `.gitattributes`） |
