import gsap from "gsap";
import luge from "@waaark/luge";
import Headroom from "headroom.js";
import lottie from "lottie-web";
import Splitting from "splitting";
import { annotate } from "rough-notation";

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
		lottie.destroy();
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
luge.lifecycle.add("pageInit", function (done) {
	// contact page
	const meetingsDiv = document.querySelector("#meetings-embed");
	const meetingsScript = document.createElement("script");
	meetingsScript.setAttribute("src", "https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js");
	if (meetingsDiv) {
		meetingsDiv.appendChild(meetingsScript);
		luge.emitter.emit("resize");
	}

	// *********************
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
