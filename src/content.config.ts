import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 三类内容（文章 / 视频 / 资源）共用同一套基础元数据，
 * 视频增加 videoUrl，资源增加 downloadUrl / githubUrl。
 */
const baseSchema = z.object({
  title: z.string(),
  type: z.enum(['article', 'video', 'resource']),
  date: z.coerce.date(),
  summary: z.string(),
  cover: z.string(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  author: z.string().default('卡卡'),
  likes: z.number().default(0),
  comments: z.number().default(0),
  views: z.number().default(0),
  videoUrl: z.string().optional(),
  /** 第三方播放器嵌入代码（如 B站 iframe），与 videoUrl 二选一，优先 embedHtml */
  embedHtml: z.string().optional(),
  downloadUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  /** 所属精选系列：ai（AI 赋能计划）/ kids（童趣智育）/ project（项目成果） */
  series: z.enum(['ai', 'kids', 'project']).optional(),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/articles' }),
  schema: baseSchema,
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/videos' }),
  schema: baseSchema,
});

const resources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/resources' }),
  schema: baseSchema,
});

export const collections = { articles, videos, resources };
