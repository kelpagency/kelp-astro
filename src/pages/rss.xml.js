import rss from "@astrojs/rss";
import { fetchWpJsonRequired } from "../lib/wp";
import { sanitizeHtml, toPlainText } from "../lib/sanitize";

export async function GET(context) {
  const posts = await fetchWpJsonRequired("/posts?per_page=100", []);
  return rss({
    title: "Kelp Current",
    description:
      "Here you'll find expert tips and tricks from the best of Kelp. Design tips, development tricks, and maybe even some tasty strategy treats",
    site: context.site,
    items: posts.map((post) => ({
      title: toPlainText(post.title.rendered),
      description: sanitizeHtml(post.excerpt.rendered),
      link: `/blog/${post.slug}`,
      pubDate: post.date,
    })),
    customData: `<language>en-us</language>`,
    stylesheet: "/rss/styles.xsl",
  });
}
