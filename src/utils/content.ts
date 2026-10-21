import { getCollection, type CollectionEntry } from 'astro:content';

export type AnyEntry =
  | CollectionEntry<'articles'>
  | CollectionEntry<'videos'>
  | CollectionEntry<'resources'>;

export interface ContentItem {
  entry: AnyEntry;
  href: string;
  type: 'article' | 'video' | 'resource';
}

/** 汇总三类已发布内容，按日期倒序。首页与列表页统一从这里取数。 */
export async function getAllContent(): Promise<ContentItem[]> {
  const [articles, videos, resources] = await Promise.all([
    getCollection('articles', ({ data }) => data.status === 'published'),
    getCollection('videos', ({ data }) => data.status === 'published'),
    getCollection('resources', ({ data }) => data.status === 'published'),
  ]);

  const items: ContentItem[] = [
    ...articles.map((entry) => ({ entry, href: `/articles/${entry.id}/`, type: 'article' as const })),
    ...videos.map((entry) => ({ entry, href: `/videos/${entry.id}/`, type: 'video' as const })),
    ...resources.map((entry) => ({ entry, href: `/resources/${entry.id}/`, type: 'resource' as const })),
  ];

  return items.sort(
    (a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime(),
  );
}
