/**
 * 站点全局信息（设计稿还原：心之所向 / 记录 · 创作 · 分享）
 */
export const site = {
  name: '心之所向',
  tagline: '记录 · 创作 · 分享',
  quote: '与更好的自己相遇',
  description: '分享创作、学习和生活中的点滴。',
  copyright: `© ${new Date().getFullYear()} 心之所向. All rights reserved.`,
  buildNote: 'All in ai | 持续学习，持续输出',
};

export const socials = [
  { name: '抖音', icon: 'tiktok', href: '#' },
  { name: '小红书', icon: 'book-open', href: '#' },
  { name: '微信', icon: 'weixin', href: '#' },
  { name: '邮箱', icon: 'envelope', href: '#' },
] as const;

/**
 * Giscus 评论配置（GitHub Discussions 驱动）
 * 启用步骤见 README「评论系统」一节：
 * 1. 仓库开启 Discussions 2. 安装 giscus App 3. 在 https://giscus.app/zh-CN 生成 repoId / categoryId 填入
 * 未配置时详情页评论区显示占位提示，不影响其他功能。
 */
export const giscus = {
  repo: 'cursor66/touchstone_v2',
  repoId: '',
  category: 'General',
  categoryId: '',
  mapping: 'pathname',
} as const;
