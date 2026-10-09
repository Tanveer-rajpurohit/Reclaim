"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { buildCloudLayer, type CloudTheme } from "./clouds";
import { drawBlueSky } from "./Sky";

const theme: CloudTheme = {
  cloudColor: [255, 255, 255],
  coveragePercentile: 0.61,
  softness: 0.3,
  grainAmount: 4,
};
let cachedCloudLayer: HTMLCanvasElement | undefined;

export default function NoiseField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    const render = () => {
      if (disposed) return;
      const width = Math.max(2, Math.min(1200, Math.round(canvas.clientWidth)));
      const height = Math.max(
        2,
        Math.round(
          (width * canvas.clientHeight) / Math.max(1, canvas.clientWidth),
        ),
      );
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = drawBlueSky(ctx, height);
      ctx.fillRect(0, 0, width, height);
      try {
        cachedCloudLayer ??= buildCloudLayer(640, 400, 14, theme);
        const cloudHeight = Math.max(height, width / 1.6);
        const cloudWidth = cloudHeight * 1.6;
        const cloudX = (width - cloudWidth) / 2;
        ctx.globalAlpha = 0.38;
        ctx.drawImage(
          cachedCloudLayer,
          cloudX + cloudWidth * 0.24,
          -height * 0.18,
          cloudWidth,
          cloudHeight,
        );
        ctx.globalAlpha = 1;
      } catch (error: unknown) {
        console.warn(
          "Cloud rendering unavailable; using the blue sky fallback.",
          error,
        );
        ctx.globalAlpha = 1;
      }
    };
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(render, 100);
    });
    observer.observe(canvas);
    render();
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const drift = gsap.to(canvas, {
          xPercent: 2,
          yPercent: -1,
          duration: 24,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        const visibility = new IntersectionObserver((entries) => {
          if (entries[0]?.isIntersecting) drift.play();
          else drift.pause();
        });
        visibility.observe(canvas);
        return () => visibility.disconnect();
      },
      canvas.parentElement ?? undefined,
    );
    return () => {
      disposed = true;
      clearTimeout(timer);
      observer.disconnect();
      media.revert();
    };
  }, []);
  return <canvas className="cloud-sky" ref={ref} aria-hidden="true" />;
}
