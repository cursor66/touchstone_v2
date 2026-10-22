/**
 * 精选系列专题（设计稿三张渐变卡片还原）
 * count 由页面按内容 frontmatter 中的 series 标签实时统计，不在此硬编码。
 */
export const series = [
  {
    id: 'ai',
    title: 'AI 赋能计划',
    description: '系统探索 AI 工具如何改变阅读、写作与工作流，提升数字化核心竞争力。',
    icon: 'robot',
    color: 'blue',
    href: '/articles/',
  },
  {
    id: 'kids',
    title: '童趣智育',
    description: '从认知启蒙到习惯养成，分享那些真正能驱动孩子成长的思考与实践。',
    icon: 'seedling',
    color: 'emerald',
    href: '/articles/',
  },
  {
    id: 'project',
    title: '项目成果',
    description: '用技术与创意沉淀成果，记录项目从 0 到 1 的实践过程、思考与收获。',
    icon: 'camera-retro',
    color: 'orange',
    href: '/videos/',
  },
] as const;
