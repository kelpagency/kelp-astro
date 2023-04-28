import rss from '@astrojs/rss';

export async function get(context) {
	const response = await fetch(`${import.meta.env.PUBLIC_WP_URL}/posts?per_page=100`);
	const posts = await response.json();
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
