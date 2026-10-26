// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  integrations: [tailwind()],
  markdown: {
    // 支持 Markdown 中的 TeX 公式（$...$ / $$...$$），构建期渲染为 KaTeX HTML
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
