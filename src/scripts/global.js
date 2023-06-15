import luge from '@waaark/luge';
import lottie from 'lottie-web/build/player/lottie_light';
import Splitting from 'splitting';
import { annotate } from 'rough-notation';

window.lottie = lottie;
window.luge = luge;

luge.settings({
	credits: {
		show: false
	},
	transition: {
		disabled: true
	},
	smooth: {
		disabled: ['tablet', 'mobile', { safari: '<=12' }],
		inertia: 0.15
	}
});

// do stuff as soon as page is ready
luge.lifecycle.add('pageInit', function (done) {
	// intialize splitting for text animations
	Splitting({ by: 'words' });

	// Underline all em tags
	// when they come into view
	const emphasisElements = document.querySelectorAll('main em');
	function handleIntersection(entries) {
		entries.map((entry) => {
			if (entry.isIntersecting) {
				const annotation = annotate(entry.target, {
					type: 'underline',
					multiline: true,
					padding: 0,
					animationDuration: 300
				});
				annotation.show();
				observer.unobserve(entry.target);
			}
		});
	}
	const observer = new IntersectionObserver(handleIntersection);
	emphasisElements?.forEach((item) => observer.observe(item));

	done();
});
