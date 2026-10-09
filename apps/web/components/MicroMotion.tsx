"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";

gsap.registerPlugin(ScrollTrigger);

const scrollOptions = {
  autoRaf: false,
  lerp: 0.065,
  smoothWheel: true,
  virtualScroll: () =>
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  prevent: (node: HTMLElement) => Boolean(node.closest(".spotlight")),
};

export default function MicroMotion() {
  const lenis = useLenis();
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const hero = document.querySelector<HTMLElement>(".hero");
    const baseline = document.querySelector<HTMLElement>(".hero-baseline");
    if (!header || !hero || !baseline || !lenis) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);
    const dialog = document.querySelector<HTMLDialogElement>(".spotlight");
    const dialogState = () => {
      if (dialog?.open) lenis.stop();
      else lenis.start();
    };
    const dialogObserver = new MutationObserver(dialogState);
    if (dialog)
      dialogObserver.observe(dialog, {
        attributes: true,
        attributeFilter: ["open"],
      });
    const navigation = gsap.context((context) => {
      let lastScroll = window.scrollY;
      let hidden = false;
      const headerMotion = gsap.to(header, {
        y: -12,
        autoAlpha: 0,
        duration: 0.4,
        ease: "power2.inOut",
        paused: true,
      });
      gsap.to(baseline, {
        autoAlpha: 0,
        y: -8,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: () => `+=${Math.min(240, window.innerHeight * 0.3)}`,
          scrub: true,
        },
      });
      const show = () => {
        if (!hidden) return;
        hidden = false;
        if (reduced.matches) headerMotion.pause(0);
        else headerMotion.reverse();
      };
      const update = () => {
        const position = Math.max(0, window.scrollY);
        const root = document.documentElement;
        root.style.setProperty(
          "--scroll-hero-height",
          `${hero.offsetHeight}px`,
        );
        root.style.setProperty("--scroll-offset", `${position}px`);
        root.style.setProperty(
          "--scroll-thumb",
          position < hero.offsetHeight * 0.5 ? "#a8c4d5" : "#8098a8",
        );
        header.classList.toggle(
          "is-scrolled",
          position > hero.offsetHeight - 96,
        );
        if (Math.abs(position - lastScroll) < 8 && position > 96) return;
        const shouldHide =
          position > 96 &&
          position > lastScroll &&
          !header.contains(document.activeElement);
        lastScroll = position;
        if (!shouldHide) show();
        else if (!hidden) {
          hidden = true;
          if (reduced.matches) headerMotion.pause(headerMotion.duration());
          else headerMotion.play();
        }
      };
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: () => context.add(update),
        onRefresh: () => context.add(update),
      });
      const focus = () => context.add(show);
      const navigate = (event: MouseEvent) => {
        if (
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey ||
          !(event.target instanceof Element)
        )
          return;
        const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
        const id = link?.getAttribute("href")?.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, {
          offset: -96,
          immediate: reduced.matches,
          duration: 1.1,
          easing: (value) => 1 - Math.pow(1 - value, 3),
          onComplete: () => {
            context.add(show);
            if (!target.hasAttribute("tabindex"))
              target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
          },
        });
      };
      header.addEventListener("focusin", focus);
      document.addEventListener("click", navigate);
      update();
      return () => {
        header.removeEventListener("focusin", focus);
        document.removeEventListener("click", navigate);
        header.classList.remove("is-scrolled");
        document.documentElement.style.removeProperty("--scroll-hero-height");
        document.documentElement.style.removeProperty("--scroll-offset");
        document.documentElement.style.removeProperty("--scroll-thumb");
      };
    });
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", (context) => {
      const panels = document.querySelectorAll<HTMLElement>(".feature-demo");
      const intro = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const window = entry.target.querySelector(
              ".mini-browser, .action-window, .replay-window",
            );
            if (window)
              context.add(() =>
                gsap.fromTo(
                  window,
                  { y: 16 },
                  { y: 0, duration: 0.8, ease: "power3.out" },
                ),
              );
            intro.unobserve(entry.target);
          }
        },
        { threshold: 0.3 },
      );
      panels.forEach((panel) => intro.observe(panel));
      const listeners: {
        panel: HTMLElement;
        enter: () => void;
        leave: () => void;
      }[] = [];
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        panels.forEach((panel) => {
          const artwork = panel.querySelector(
            ".mini-browser, .action-window, .replay-window",
          );
          if (!artwork) return;
          const enter = () =>
            context.add(() =>
              gsap.to(artwork, {
                y: -8,
                duration: 0.4,
                ease: "power3.out",
                overwrite: "auto",
              }),
            );
          const leave = () =>
            context.add(() =>
              gsap.to(artwork, {
                y: 0,
                duration: 0.5,
                ease: "power3.out",
                overwrite: "auto",
              }),
            );
          panel.addEventListener("pointerenter", enter);
          panel.addEventListener("pointerleave", leave);
          listeners.push({ panel, enter, leave });
        });
      }
      return () => {
        intro.disconnect();
        for (const { panel, enter, leave } of listeners) {
          panel.removeEventListener("pointerenter", enter);
          panel.removeEventListener("pointerleave", leave);
        }
      };
    });
    return () => {
      media.revert();
      navigation.revert();
      dialogObserver.disconnect();
      gsap.ticker.remove(tick);
      lenis.off("scroll", ScrollTrigger.update);
    };
  }, [lenis]);
  return <ReactLenis root options={scrollOptions} />;
}
