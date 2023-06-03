import luge from '@waaark/luge';
import Flickity from 'flickity';
import 'flickity-fade';
import Headroom from 'headroom.js';
import lottie from 'lottie-web/build/player/lottie_light';
import Splitting from 'splitting';
import { annotate } from 'rough-notation';

window.lottie = lottie;

// the preload animation
luge.preloader.add((done, remove) => {
	const preloader = document.querySelector('.lg-preloader');
	const preloaderLogo = document.querySelector('.lg-preloader .lg-lottie');
	// play lottie animation
	preloaderLogo.play();
	// fade in
	preloaderLogo.animate([{ opacity: 1, transform: 'scale(1)' }], {
		fill: 'forwards',
		duration: 200,
		iterations: 1,
		easing: 'ease'
	});
	// fade out
	preloaderLogo.animate([{ opacity: 0, transform: 'scale(0)' }], {
		fill: 'forwards',
		duration: 300,
		iterations: 1,
		delay: 1000,
		easing: 'ease'
	});
	// fade out
	preloader.animate([{ opacity: 0 }], {
		fill: 'forwards',
		duration: 300,
		iterations: 1,
		delay: 1000,
		easing: 'ease'
	});
	setTimeout(() => {
		// stop lottie animation to prevent memory leak
		preloaderLogo.stop();
		done();
		remove();
	}, 1400);
});

luge.settings({
	credits: {
		show: false
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

	// team page easter eggs
	const skeleton = document.querySelector('.button--skeleton');
	const team = document.querySelector('.team');

	skeleton?.addEventListener('click', function () {
		team.classList.toggle('skulls');
	});

	const disco = document.querySelector('.button--disco');
	disco?.addEventListener('click', function () {
		team.classList.toggle('dance');
	});

	const workPostFilter = document.querySelector('.work-post-filter');
	workPostFilter?.addEventListener('change', function (event) {
		window.location.href = event.target.value;
	});

	const videos = document.querySelectorAll('.video-showcase video');
	videos?.forEach(function (video) {
		video.play();
	});

	done();
});

// do stuff right after page in animation
luge.lifecycle.add('pageIn', function (done) {
	// recent work slider
	const slider = document.querySelector('.slider');
	if (slider) {
		const next = document.querySelectorAll('.button--next');
		const prev = document.querySelectorAll('.button--prev');
		const flkty = new Flickity(slider, {
			prevNextButtons: false,
			wrapAround: true,
			pageDots: false,
			fade: true
		});
		next.forEach(function (button) {
			button.addEventListener('click', function () {
				flkty.next();
			});
		});
		prev.forEach(function (button) {
			button.addEventListener('click', function () {
				flkty.previous();
			});
		});
		luge.emitter.emit('resize');
	}

	// Contact page
	// meetings embed
	const meetingsDiv = document.querySelector('#meetings-embed');
	if (meetingsDiv) {
		const meetingsScript = document.createElement('script');
		meetingsScript.setAttribute('src', 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js');
		meetingsDiv.appendChild(meetingsScript);
	}

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

	// footer subscription newsletter submission
	const form = document.querySelector('.footer form');
	form.addEventListener('submit', function (event) {
		event.preventDefault();
		const email = form.querySelector('input').value;
		var data = {
			fields: [
				{
					objectTypeId: '0-1',
					name: 'email',
					value: email
				}
			],
			context: {
				pageUri: document.URL,
				pageName: document.getElementsByTagName('title')[0].innerHTML
			}
		};
		fetch('https://api.hsforms.com/submissions/v3/integration/submit/4726858/482f7920-2b7c-4604-95f8-43994269d026', {
			method: 'POST', // or 'PUT'
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
			.then((response) => response.json())
			.then((data) => {
				console.log('Success:', data);
				form.innerHTML = data.inlineMessage;
			})
			.catch((error) => {
				form.innerHTML = error;
			});
	});

	// leave a comment
	const commentForm = document.querySelector('.leave-a-comment form');
	commentForm?.addEventListener('submit', function (event) {
		event.preventDefault();
		const email = commentForm.querySelector("input[type='email']").value;
		const name = commentForm.querySelector('input[type="text"]').value;
		const comment = commentForm.querySelector('textarea').value;
		const postId = commentForm.querySelector('input[type="hidden"]').value;
		const button = commentForm.querySelector('button');
		button.innerText = '... posting ...';
		const data = {
			post: postId,
			author_name: name,
			author_email: email,
			content: comment
		};
		fetch('https://live-kelp.pantheonsite.io/wp-json/wp/v2/comments', {
			method: 'POST', // or 'PUT'
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
			.then((response) => response.json())
			.then((data) => {
				console.log('Success:', data);
				commentForm.innerHTML = 'Comment submitted!';
			})
			.catch((error) => {
				commentForm.innerHTML = error;
			});
	});

	done();
});

// Sticky header
const header = document.querySelector('header');
const headroom = new Headroom(header, {
	offset: {
		up: 50,
		down: 50
	},
	// scroll tolerance in px before state changes
	tolerance: {
		up: 5,
		down: 0
	}
});
headroom.init();

// mobile nav
const burger = document.querySelector('.hamburger');
burger?.addEventListener('click', function (event) {
	burger.classList.toggle('active');
	document.body.classList.toggle('mobile-menu-active');
});

// fix for anchor links
luge.lifecycle.add('pageIn', navigateToTarget);

function navigateToTarget(done) {
	const hash = window.location.hash;
	if (hash) {
		const target = document.querySelector(hash);
		if (target) {
			window.scrollTo(0, target.getBoundingClientRect().top + window.unifiedScrollTop);
		}
	}

	done();
}
