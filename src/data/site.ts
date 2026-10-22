/**
 * 站点全局信息（设计稿还原：心之所向 / 记录 · 创作 · 分享）
 */
export const site = {
  name: '心之所向',
  tagline: '记录 · 创作 · 分享',
  quote: '与更好的自己相遇',
  description: '分享创作、学习和生活中的点滴。',
  copyright: `© ${new Date().getFullYear()} 心之所向. All rights reserved.`,
  buildNote: '本网站由 AI 辅助构建 | 持续学习，持续输出',
};

export const socials = [
  { name: '抖音', icon: 'tiktok', href: '#' },
  { name: '小红书', icon: 'book-open', href: '#' },
  { name: '微信', icon: 'weixin', href: '#' },
  { name: '邮箱', icon: 'envelope', href: '#' },
] as const;
