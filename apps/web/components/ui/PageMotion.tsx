"use client";
import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
export default function PageMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(root.current, {
        y: 8,
        duration: 0.32,
        ease: "power2.out",
        clearProps: "transform",
      });
    });
    return () => media.revert();
  }, []);
  return (
    <div ref={root} className="min-w-0">
      {children}
    </div>
  );
}
