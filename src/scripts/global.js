import gsap from "gsap";
import luge from "@waaark/luge";
import Flickity from "flickity";
import "flickity-fade";
import Headroom from "headroom.js";
import lottie from "lottie-web";
import Splitting from "splitting";
import { annotate } from "rough-notation";
import imagesLoaded from "imagesloaded";

Splitting();

window.lottie = lottie;

// the preload animation
luge.preloader.add((done, remove) => {
	const preloaderLogo = document.querySelector(".lg-preloader .lg-lottie");
	preloaderLogo.play();
	gsap.to(".lg-preloader .lg-lottie", { opacity: 1, scale: 1, delay: 0, ease: "power4" });
	gsap.to(".lg-preloader .lg-lottie", { opacity: 0, scale: 0, duration: 0.5, delay: 1.5, ease: "expo" });
	gsap.to(".lg-preloader", { opacity: 0, delay: 1.6, duration: 0.4 });
	setTimeout(() => {
		preloaderLogo.stop();
		done();
		remove();
	}, 2000);
});

luge.settings({
	credits: {
		show: false
	},
	smooth: {
		disabled: ["tablet", "mobile", { safari: "<=12" }],
		inertia: 0.15
	}
});

// wait till images load before starting animation library
luge.lifecycle.add("pageIn", function (done) {
	// Home page
	const squid = document.querySelector(".hero .lg-lottie");
	if (squid) {
		squid.play();
	}

	imagesLoaded(document.body, function () {
		luge.emitter.emit("resize");
	});

	// recent work slider
	const slider = document.querySelector(".slider");
	const next = document.querySelectorAll(".button--next");
	const prev = document.querySelectorAll(".button--prev");
	if (slider) {
		const flkty = new Flickity(slider, {
			prevNextButtons: false,
			wrapAround: true,
			pageDots: false,
			fade: true
		});
		next.forEach(function (button) {
			button.addEventListener("click", function () {
				flkty.next();
			});
		});
		prev.forEach(function (button) {
			button.addEventListener("click", function () {
				flkty.previous();
			});
		});
		luge.emitter.emit("resize");
	}

	// Contact page
	// meetings embed
	const meetingsDiv = document.querySelector("#meetings-embed");
	const meetingsScript = document.createElement("script");
	meetingsScript.setAttribute("src", "https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js");
	if (meetingsDiv) {
		meetingsDiv.appendChild(meetingsScript);
	}

	// Underline all em tags
	// when they come into view
	const emphasisElements = document.querySelectorAll("main em");
	function handleIntersection(entries) {
		entries.map((entry) => {
			if (entry.isIntersecting) {
				const annotation = annotate(entry.target, {
					type: "underline",
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
	emphasisElements.forEach((item) => observer.observe(item));

	// footer subscription newsletter submission
	const form = document.querySelector(".footer form");
	form.addEventListener("submit", function (event) {
		event.preventDefault();
		const email = form.querySelector("input").value;
		var data = {
			fields: [
				{
					objectTypeId: "0-1",
					name: "email",
					value: email
				}
			],
			context: {
				pageUri: document.URL,
				pageName: document.getElementsByTagName("title")[0].innerHTML
			}
		};
		fetch(
			"https://api.hsforms.com/submissions/v3/integration/submit/4726858/482f7920-2b7c-4604-95f8-43994269d026",
			{
				method: "POST", // or 'PUT'
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(data)
			}
		)
			.then((response) => response.json())
			.then((data) => {
				console.log("Success:", data);
				form.innerHTML = data.inlineMessage;
			})
			.catch((error) => {
				form.innerHTML = error;
			});
	});

	// leave a comment
	const commentForm = document.querySelector(".leave-a-comment form");
	commentForm?.addEventListener("submit", function (event) {
		event.preventDefault();
		const email = commentForm.querySelector("input[type='email']").value;
		const name = commentForm.querySelector('input[type="text"]').value;
		const comment = commentForm.querySelector("textarea").value;
		const postId = commentForm.querySelector('input[type="hidden"]').value;
		const button = commentForm.querySelector("button");
		button.innerText = "... posting ...";
		const data = {
			post: postId,
			author_name: name,
			author_email: email,
			content: comment
		};
		fetch("https://admin.kelp.agency/wp-json/wp/v2/comments", {
			method: "POST", // or 'PUT'
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data)
		})
			.then((response) => response.json())
			.then((data) => {
				console.log("Success:", data);
				commentForm.innerHTML = "Comment submitted!";
			})
			.catch((error) => {
				commentForm.innerHTML = error;
			});
	});

	done();
});

// Sticky header
const header = document.querySelector("header");
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
const burger = document.querySelector(".hamburger");
burger?.addEventListener("click", function (event) {
	burger.classList.toggle("active");
	document.body.classList.toggle("mobile-menu-active");
});
