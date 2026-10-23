# 部署前检查清单

> 首次上线前按顺序逐项确认。每项都对应仓库中的具体文件，完成一项勾一项。

## 一、服务器准备（1Panel）

- [ ] 服务器已安装 Docker 与 Docker Compose 插件（`docker compose version` 可用）
- [ ] 1Panel 已安装并可正常访问
- [ ] 创建部署目录 `/opt/creative-site/`
- [ ] 将仓库 [deploy/compose.yaml](compose.yaml) 复制到 `/opt/creative-site/compose.yaml`
- [ ] 参考 [deploy/.env.production.example](.env.production.example) 创建 `/opt/creative-site/.env.production`，填写：
  - [ ] `POSTGRES_USER` / `POSTGRES_PASSWORD`（强密码，不要复用示例值）
  - [ ] `POSTGRES_DB`
  - [ ] `WEB_IMAGE`（首次可填 `ghcr.io/<你的用户名>/my-creative-site:bootstrap`，首次部署会被 deploy.sh 覆盖）
- [ ] 将仓库 [deploy/deploy.sh](deploy.sh) 复制到 `/opt/creative-site/deploy.sh` 并 `chmod +x`
- [ ] 创建数据目录 `mkdir -p /opt/creative-site/data`（history.json 挂载点，见 compose.yaml volumes）
- [ ] 创建数据库迁移目录 `mkdir -p /opt/creative-site/db` 并将 [../db/migrations/001_init.sql](../db/migrations/001_init.sql) 复制到 `/opt/creative-site/db/migrations/001_init.sql`（首次启动自动执行）
- [ ] 服务器可拉取 GHCR 镜像：`docker login ghcr.io`（私有包需 PAT，勾选 `read:packages`）

## 二、GitHub 配置

- [ ] 仓库 Settings → Secrets and variables → Actions 已配置：
  - [ ] `DEPLOY_HOST`（服务器 IP 或域名）
  - [ ] `DEPLOY_USER`（SSH 登录用户）
  - [ ] `DEPLOY_SSH_KEY`（私钥全文，对应公钥已在服务器 `~/.ssh/authorized_keys`）
- [ ] 从 CI 机器可连通：`ssh <DEPLOY_USER>@<DEPLOY_HOST>` 免密成功
- [ ] 仓库 Settings → Actions → General → Workflow permissions 为 "Read and write permissions"（推送 GHCR 需要 `packages: write`）

## 三、域名与反向代理

- [ ] 域名 DNS 已解析到服务器 IP
- [ ] 1Panel 中创建网站/反向代理，将域名转发到 `http://127.0.0.1:18080`（compose 中 web 仅绑定回环地址，不直接暴露）
- [ ] 已申请并启用 HTTPS 证书（1Panel 一键 Let's Encrypt）

## 四、部署前本地验证

- [ ] `npm run check` 通过（内容校验 + 类型检查，0 errors）
- [ ] `npm run build` 成功（18 页）
- [ ] `node scripts/sync-content-db.mjs > contents.sql` 能正常生成 SQL
- [ ] 工作区干净：`git status` 无未提交改动，本地与 origin/main 同步

## 五、执行首次部署

- [ ] 打标签触发完整链路：`./scripts/release.sh v1.0.0`（或手动 workflow_dispatch）
- [ ] 观察 Actions：build（校验 → 构建 → 推镜像）→ deploy（上传 contents.sql → SSH 执行 deploy.sh → 健康检查 → 写库 → 导出 history.json）

## 六、部署后验证

- [ ] 站点可访问：`https://<域名>` 返回 200，样式与图片正常
- [ ] 内容索引已入库：`docker compose exec db psql -U <user> -d <db> -c "SELECT content_type, COUNT(*) FROM contents GROUP BY 1"` 应为 article 7 / video 2 / resource 3
- [ ] 发布记录已写入：`SELECT release_version, git_sha, status FROM deployments ORDER BY deployed_at DESC LIMIT 3` 含 v1.0.0 / success
- [ ] 历史导出正常：`cat /opt/creative-site/data/history.json` 为 JSON 数组，且 `https://<域名>/data/history.json` 可访问
- [ ] `/history` 页面显示真实发布卡片（不再是"暂无发布记录"）
- [ ] 首页工具栏（筛选 / 排序 / 搜索）在线环境功能正常
- [ ] 回滚链路心里有数：deploy.sh 失败会自动回滚 compose 中的镜像引用；历史版本回滚 = 重新打对应 tag 或手动改 `WEB_IMAGE` 后 `docker compose up -d`

## 常见坑（本项目已踩过）

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| Validate content 全报「缺少 Frontmatter」 | CRLF 换行 | 已修复（脚本统一换行符 + `.gitattributes` 强制 LF） |
| build 阶段 `Property 'count' does not exist` | 组件 props 变更未同步所有引用 | `npm run check` 本地先跑，勿截断输出 |
| deploy 阶段 SSH/scp 失败 | secrets 未配置或目录不存在 | 检查清单第二节 + 第一节目录权限 |
| `contents` 表为空 | contents.sql 未上传或未应用 | 查看 deploy 步骤日志中 "Content index synced" |
