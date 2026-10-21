/**
 * 设计系统 Token 配置
 * 颜色直接使用 Tailwind 默认调色板（与设计稿编译产物一致）：
 * - primary: blue-600  |  success: emerald-600  |  accent: orange-600
 * - 页面背景: gray-50 (#f9fafb) | 深色区域: slate-900
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
