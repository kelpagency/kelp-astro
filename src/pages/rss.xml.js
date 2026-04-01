import rss from '@astrojs/rss';
import { fetchWpJson } from '../lib/wp';

export async function GET(context) {
	const posts = await fetchWpJson('/posts?per_page=100', []);
	return rss({
		title: 'Kelp Current',
		description:
			"Here you'll find expert tips and tricks from the best of Kelp. Design tips, development tricks, and maybe even some tasty strategy treats",
		site: context.site,
		items: posts.map((post) => ({
			title: post.title.rendered,
			description: post.excerpt.rendered,
			link: `/blog/${post.slug}`,
			pubDate: post.date
		})),
		customData: `<language>en-us</language>`,
		stylesheet: '/rss/styles.xsl'
	});
}
