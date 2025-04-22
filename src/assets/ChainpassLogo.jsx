import React, { useEffect, useState } from 'react';
import { ChainPassLogoBase64 } from './chainpass-logo';

export const AnimatedChainPassLogo = ({ className, width = "200px", height = "auto", id = "chainpass-logo" }) => {
  const [glowPulse, setGlowPulse] = useState(0);
  const [animationActive, setAnimationActive] = useState(false);

  // Subtle glow animation
  useEffect(() => {
    let intervalId;
    let timeout;

    // Initialize animation after a delay
    timeout = setTimeout(() => {
      let direction = 1;
      let value = 0;
      
      intervalId = setInterval(() => {
        if (value >= 100) direction = -1;
        if (value <= 0) direction = 1;
        
        value += direction * 1; // Slow, subtle change
        setGlowPulse(value);
      }, 50);
    }, 2000);  // Start animation after 2 seconds

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalId);
    };
  }, []);

  // Custom SVG filter for professional glow
  const logoFilter = `
    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <filter id="${id}-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
          <feBlend in="SourceGraphic" in2="glow" mode="normal" />
        </filter>
        
        <linearGradient id="${id}-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f3644" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#5eb996" stop-opacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  `;

  // Render SVG and the actual logo image
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: width, height: height }}
      onMouseEnter={() => setAnimationActive(true)}
      onMouseLeave={() => setAnimationActive(false)}
    >
      {/* SVG Filters */}
      <div dangerouslySetInnerHTML={{ __html: logoFilter }} />
      
      {/* Base Logo */}
      <div className="relative">
        <img 
          src={ChainPassLogoBase64}
          alt="ChainPass Logo"
          className="w-full h-full object-contain transition-all duration-500"
          style={{
            filter: animationActive || glowPulse > 50 
              ? `drop-shadow(0 0 ${2 + (glowPulse / 50)}px rgba(59, 130, 246, 0.${Math.floor(glowPulse / 20)}))` 
              : 'none',
            transform: animationActive ? 'scale(1.03)' : 'scale(1)',
          }}
        />
        
        {/* Decorative elements that enhance the professional look */}
        <div 
          className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/30 to-emerald-500/30 rounded-full opacity-0 transition-opacity duration-500"
          style={{ 
            opacity: animationActive ? 0.8 : glowPulse > 80 ? 0.3 : 0, 
            filter: 'blur(1px)'
          }}
        />
        
        {/* Subtle overlay for hover state */}
        <div 
          className="absolute inset-0 rounded-md bg-gradient-to-br opacity-0 transition-opacity duration-300"
          style={{ 
            opacity: animationActive ? 0.05 : 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>
    </div>
  );
}; 