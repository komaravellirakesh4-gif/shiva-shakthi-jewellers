'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Moon } from 'lucide-react';

/**
 * A decorative background effect with floating gold stars, moons, bricks, and silver biscuits.
 */
export function JewelryBackgroundEffect() {
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    const types = ['star', 'brick', 'biscuit', 'moon'];
    // Generate a set of decorative elements with random properties
    const newElements = Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      type: types[i % types.length],
      left: `${Math.random() * 100}%`,
      duration: `${25 + Math.random() * 30}s`, // Slow drift
      delay: `${Math.random() * -30}s`, // Negative delay so some start mid-screen
      // Mix of small (8px) and big (40px) sizes for depth
      size: 8 + Math.random() * 32,
      opacity: 0.15 + Math.random() * 0.2, // Darker visibility
      rotation: Math.random() * 360,
    }));
    setElements(newElements);
  }, []);

  if (elements.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden no-print" 
      aria-hidden="true"
    >
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute animate-float-up"
          style={{
            left: el.left,
            bottom: '-100px',
            animationDuration: el.duration,
            animationDelay: el.delay,
            opacity: el.opacity,
            transform: `rotate(${el.rotation}deg)`,
          }}
        >
          {el.type === 'star' && (
            <Sparkles 
              size={el.size} 
              className="text-amber-600 fill-amber-500/30" 
            />
          )}
          {el.type === 'moon' && (
            <Moon 
              size={el.size} 
              className="text-amber-500 fill-amber-400/20" 
            />
          )}
          {el.type === 'brick' && (
            <div 
              style={{ 
                width: el.size * 2, 
                height: el.size, 
                borderRadius: '2px',
                transform: `rotate(${el.rotation}deg)` 
              }}
              className="bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 shadow-lg border border-amber-500/30"
            />
          )}
          {el.type === 'biscuit' && (
            <div 
              style={{ 
                width: el.size * 2, 
                height: el.size, 
                borderRadius: '2px',
                transform: `rotate(${el.rotation}deg)` 
              }}
              className="bg-gradient-to-br from-slate-300 via-slate-500 to-slate-700 shadow-lg border border-slate-400/30"
            />
          )}
        </div>
      ))}
    </div>
  );
}
