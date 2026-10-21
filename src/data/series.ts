/**
 * 精选系列专题（设计稿三张渐变卡片还原）
 */
export const series = [
  {
    title: 'AI 赋能计划',
    description: '系统探索 AI 工具如何改变阅读、写作与工作流，提升数字化核心竞争力。',
    count: 12,
    icon: 'robot',
    color: 'blue',
    href: '/articles/',
  },
  {
    title: '个人成长法则',
    description: '从认知升级到习惯养成，分享那些真正能驱动长期价值的思考与实践。',
    count: 8,
    icon: 'seedling',
    color: 'emerald',
    href: '/articles/',
  },
  {
    title: '影像叙事之道',
    description: '用镜头记录生活，用影像讲述故事。涵盖摄影入门、后期与视觉表达心得。',
    count: 15,
    icon: 'camera-retro',
    color: 'orange',
    href: '/videos/',
  },
] as const;
