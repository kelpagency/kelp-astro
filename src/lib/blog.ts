import type { BlogTeasePost } from "../components/Tease.astro";
import { fetchWpCollectionRequired } from "./wp";

export const BLOG_PAGE_SIZE = 12;

export const isVisibleBlogCategory = (category: {
  slug?: unknown;
  name?: unknown;
}) =>
  String(category.slug ?? "").toLowerCase() !== "featured" &&
  String(category.name ?? "")
    .trim()
    .toLowerCase() !== "featured";

export const getBlogPosts = () =>
  fetchWpCollectionRequired<BlogTeasePost>(
    "/posts?_embed&orderby=date&order=desc",
  );

export const getCategoryPosts = (posts: BlogTeasePost[], categoryId: number) =>
  posts.filter((post) => post.categories?.includes(categoryId));

// The existing archive URL is page one; only later pages need new routes.
export const getBlogPageNumbers = (postCount: number) =>
  Array.from(
    { length: Math.max(0, Math.ceil(postCount / BLOG_PAGE_SIZE) - 1) },
    (_, index) => String(index + 2),
  );

export const getBlogPageUrl = (baseUrl: string, page: number) =>
  page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
