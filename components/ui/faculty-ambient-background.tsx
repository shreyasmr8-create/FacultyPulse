"use client";

import React, { useEffect, useRef } from "react";

interface AmbientBackgroundProps {
  interactiveColor?: string;
  defaultDotColor?: string;
  spacing?: number;
}

/**
 * FacultyAmbientBackground
 * High-performance, lightweight interactive canvas dot-grid and ambient mesh.
 * Engineered for maximum legibility of academic metrics, data tables, and forms.
 */
export function FacultyAmbientBackground({
  interactiveColor = "#2563eb",
  defaultDotColor = "rgba(148, 163, 184, 0.22)",
  spacing = 32,
}: AmbientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let mouseX = -1000;
    let mouseY = -1000;
    let isMobile = false;

    const BASE_R = 1.2;
    const HOVER_R = 90;
    const SCAN_DUR = 3000;
    const SCAN_PAUSE = 5000;

    class MicroParticle {
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      size = 0;

      constructor(w: number, h: number) {
        this.reset(w, h);
      }

      reset(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.size = Math.random() * 1.5 + 0.5;
      }

      update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = "rgba(37, 99, 235, 0.08)";
        c.fill();
      }
    }

    const particles: MicroParticle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      isMobile = window.innerWidth < 768;
      particles.length = 0;
      const count = isMobile ? 12 : 28;
      for (let i = 0; i < count; i++) {
        particles.push(new MicroParticle(canvas.width, canvas.height));
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    };

    const onMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render micro particles in background
      particles.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
      });

      const loopTime = performance.now() % (SCAN_DUR + SCAN_PAUSE);
      const scanY = isMobile
        ? (Math.min(loopTime / SCAN_DUR, 1)) * (canvas.height + HOVER_R * 2) - HOVER_R
        : 0;

      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = isMobile ? Math.abs(y - scanY) : Math.sqrt(dx * dx + dy * dy);

          if (dist < HOVER_R) {
            const scale = 1 - dist / HOVER_R;
            ctx.fillStyle = interactiveColor;
            ctx.shadowBlur = isMobile ? 0 : 12;
            ctx.shadowColor = isMobile ? "transparent" : "rgba(37, 99, 235, 0.35)";
            ctx.beginPath();
            ctx.arc(x, y, BASE_R + scale * (isMobile ? 1.5 : 2.5), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = defaultDotColor;
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
            ctx.beginPath();
            ctx.arc(x, y, BASE_R, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(raf);
    };
  }, [interactiveColor, defaultDotColor, spacing]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/70"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Atmospheric mesh gradient highlights for depth without clutter */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[45%] h-[45%] rounded-full opacity-40 blur-[130px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(219, 234, 254, 0.8) 0%, rgba(191, 219, 254, 0) 70%)",
        }}
      />
      <div
        className="absolute -bottom-[15%] -right-[10%] w-[40%] h-[40%] rounded-full opacity-35 blur-[130px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(224, 231, 255, 0.7) 0%, rgba(199, 210, 254, 0) 70%)",
        }}
      />
    </div>
  );
}
