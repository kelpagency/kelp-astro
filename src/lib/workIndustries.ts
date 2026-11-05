import { toPlainText } from "./sanitize";

export function getWorkIndustries(
  tags: Array<{ id: number; slug: string; name: string }>,
  posts: Array<{ tags: number[]; fimg_url?: string }>,
) {
  const usedTags = new Set(
    posts.filter((post) => Boolean(post.fimg_url)).flatMap((post) => post.tags),
  );
  return tags
    .filter((tag) => tag.slug.startsWith("industry-") && usedTags.has(tag.id))
    .map((tag) => ({
      id: tag.id,
      value: tag.slug.replace(/^industry-/, ""),
      label: toPlainText(tag.name.replace(/^Industry:\s*/i, "")),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
