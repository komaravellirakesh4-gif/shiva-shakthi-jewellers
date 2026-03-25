
'use client';

import React, { useEffect, useRef } from 'react';
import { useGoldStore } from '@/lib/store';

/**
 * A premium cursor effect that creates a trail of gold sparkling particles.
 * Uses Canvas for high-performance rendering.
 */
export function GoldCursorEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const showCursorEffect = useGoldStore((state) => state.showCursorEffect);

  useEffect(() => {
    if (!showCursorEffect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      life: number;
      opacity: number;
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1.0;
        this.speedX = (Math.random() - 0.5) * 2.0;
        this.speedY = (Math.random() - 0.5) * 2.0;
        this.life = 1.0;
        this.opacity = Math.random() * 0.8 + 0.2;
        
        const colors = [
          '46, 65%, 52%', // Primary Gold
          '35, 90%, 60%', // Brighter Gold
          '20, 80%, 40%', // Darker Burnt Gold/Orange
          '46, 80%, 35%', // Deep Dark Gold
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.012;
        if (this.size > 0.1) this.size -= 0.012;
      }

      draw(context: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        
        context.fillStyle = `hsla(${this.color}, ${this.life * this.opacity})`;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        
        if (this.size > 2.0) {
          context.shadowBlur = 8;
          context.shadowColor = `hsla(${this.color}, ${this.life * 0.6})`;
        } else {
          context.shadowBlur = 0;
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      for (let i = 0; i < 5; i++) {
        particles.push(new Particle(e.clientX, e.clientY));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(e.touches[0].clientX, e.touches[0].clientY));
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
        
        if (particles[i].life <= 0) {
          particles.splice(i, 1);
          i--;
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showCursorEffect]);

  if (!showCursorEffect) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] no-print"
      aria-hidden="true"
    />
  );
}
