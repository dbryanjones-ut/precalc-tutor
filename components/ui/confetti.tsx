"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfettiProps {
  active?: boolean;
  duration?: number;
  particleCount?: number;
  className?: string;
}

interface Particle {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  color: string;
  size: number;
  rotation: number;
  swingAmount: number;
}

const COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#FFE66D", // Yellow
  "#A8E6CF", // Mint
  "#FF8B94", // Pink
  "#95E1D3", // Turquoise
  "#FFA07A", // Light Salmon
  "#B4A7D6", // Lavender
];

export function Confetti({
  active = true,
  duration = 3000,
  particleCount = 50,
  className,
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(active);

  useEffect(() => {
    if (active) {
      setIsVisible(true);

      // Generate particles
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDuration: 2 + Math.random() * 2,
        animationDelay: Math.random() * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        swingAmount: 30 + Math.random() * 60,
      }));

      setParticles(newParticles);

      // Clean up after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, particleCount]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-50 overflow-hidden",
        className
      )}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${particle.left}%`,
            animationDuration: `${particle.animationDuration}s`,
            animationDelay: `${particle.animationDelay}s`,
            animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            "--swing-amount": `${particle.swingAmount}px`,
          } as React.CSSProperties}
        >
          <div
            className="animate-confetti-spin"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "0%",
              animationDuration: `${1 + Math.random()}s`,
              animationDelay: `${particle.animationDelay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Add to your tailwind.config.js:
// animation: {
//   'confetti-fall': 'confetti-fall 3s ease-out forwards',
//   'confetti-spin': 'confetti-spin 1s linear infinite',
// },
// keyframes: {
//   'confetti-fall': {
//     '0%': { transform: 'translateY(-100vh) translateX(0)' },
//     '100%': { transform: 'translateY(100vh) translateX(var(--swing-amount))' },
//   },
//   'confetti-spin': {
//     '0%': { transform: 'rotate(0deg)' },
//     '100%': { transform: 'rotate(360deg)' },
//   },
// }
