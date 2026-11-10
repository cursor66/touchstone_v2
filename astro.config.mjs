// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * 兼容 LaTeX 定界符：将文本中的 \[ ... \] / \( ... \) 改写为 math / inlineMath 节点，
 * 并附带 mdast-util-math 约定的 hast 提示（hName / hProperties），
 * 由 remark-rehype 转换为 <pre class="math-display"> / <code class="math-inline">，
 * 最终交给 rehype-katex 渲染。remark-math 默认只识别 $...$ / $$...$$。
 */
function remarkBracketMath() {
  /** @param {string} tex @param {boolean} display */
  function mathNode(tex, display) {
    const className = ['language-math', display ? 'math-display' : 'math-inline'];
    if (display) {
      return {
        type: 'math',
        value: tex,
        data: {
          hName: 'pre',
          hChildren: [
            {
              type: 'element',
              tagName: 'code',
              properties: { className },
              children: [{ type: 'text', value: tex }],
            },
          ],
        },
      };
    }
    return { type: 'inlineMath', value: tex, data: { hName: 'code', hProperties: { className } } };
  }

  /** @param {string} value */
  function splitMath(value) {
    /** @type {Array<object>} */
    const nodes = [];
    // 先块级 \[...\]（可跨行），再行内 \(...\)
    const pattern = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
    let last = 0;
    let m;
    while ((m = pattern.exec(value)) !== null) {
      if (m.index > last) nodes.push({ type: 'text', value: value.slice(last, m.index) });
      const display = m[1] !== undefined;
      nodes.push(mathNode((display ? m[1] : m[2]).trim(), display));
      last = m.index + m[0].length;
    }
    if (nodes.length === 0) return null;
    if (last < value.length) nodes.push({ type: 'text', value: value.slice(last) });
    return nodes;
  }

  /** @param {{children?: any[]}} node */
  function walk(node) {
    if (!node.children) return;
    const out = [];
    for (const child of node.children) {
      if (child.type === 'text') {
        out.push(...(splitMath(child.value) ?? [child]));
      } else {
        walk(child);
        out.push(child);
      }
    }
    node.children = out;
  }

  return (tree) => walk(tree);
}

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  integrations: [tailwind()],
  markdown: {
    // 支持 Markdown 中的 TeX 公式（$...$ / $$...$$ / \[...\] / \(...\)），构建期渲染为 KaTeX HTML
    remarkPlugins: [remarkBracketMath, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
