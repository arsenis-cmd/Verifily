import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Fade up animation
export function fadeUpOnScroll(element: string) {
  gsap.from(element, {
    scrollTrigger: {
      trigger: element,
      start: 'top 85%',
      end: 'top 65%',
      toggleActions: 'play none none reverse',
    },
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
  });
}

// Staggered children animation
export function staggerChildren(parent: string, children: string) {
  gsap.from(`${parent} ${children}`, {
    scrollTrigger: {
      trigger: parent,
      start: 'top 80%',
    },
    y: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power2.out',
  });
}

// Counter animation
export function animateCounter(element: string, target: number) {
  gsap.to(element, {
    scrollTrigger: {
      trigger: element,
      start: 'top 80%',
    },
    innerText: target,
    duration: 2,
    snap: { innerText: 1 },
    ease: 'power1.out',
  });
}

// Framer Motion variants for component-level animations
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};
