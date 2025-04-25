import React, { useEffect, useState } from 'react';
import { ChainPassLogoBase64 } from './chainpass-logo';

export const AnimatedChainPassLogo = ({ className, width = "200px", height = "auto", id = "chainpass-logo" }) => {
  const [glowPulse, setGlowPulse] = useState(0);
  const [animationActive, setAnimationActive] = useState(false);

  // Enhanced glow animation
  useEffect(() => {
    let intervalId;
    let timeout;

    // Smoother initialization with delay
    timeout = setTimeout(() => {
      let direction = 1;
      let value = 0;
      
      intervalId = setInterval(() => {
        if (value >= 100) direction = -1;
        if (value <= 0) direction = 1;
        
        value += direction * 0.8; // Slower, more subtle change
        setGlowPulse(value);
      }, 40); // Shorter interval for smoother animation
    }, 1500);  // Start animation sooner

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalId);
    };
  }, []);

  // Enhanced SVG filters for more professional effects
  const logoFilter = `
    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <filter id="${id}-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
          <feBlend in="SourceGraphic" in2="glow" mode="normal" />
        </filter>
        
        <linearGradient id="${id}-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0057ff" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#0066ff" stop-opacity="0.8" />
        </linearGradient>
        
        <filter id="${id}-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.2" />
        </filter>
      </defs>
    </svg>
  `;

  // Render the logo with enhanced effects
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: width, height: height }}
      onMouseEnter={() => setAnimationActive(true)}
      onMouseLeave={() => setAnimationActive(false)}
    >
      {/* Enhanced SVG Filters */}
      <div dangerouslySetInnerHTML={{ __html: logoFilter }} />
      
      {/* ChainPass Logo with Container */}
      <div className="relative rounded-lg overflow-hidden">
        {/* Subtle background glow effect */}
        <div 
          className="absolute inset-0 opacity-0 transition-opacity duration-300 bg-blue-500/5 rounded-lg"
          style={{ 
            opacity: animationActive ? 0.7 : 0,
            backdropFilter: 'blur(8px)'
          }}
        />
        
        {/* Main Logo */}
        <img 
          src={ChainPassLogoBase64}
          alt="ChainPass Logo"
          className="w-full h-full object-contain transition-all duration-500 relative z-10"
          style={{
            filter: animationActive || glowPulse > 50 
              ? `drop-shadow(0 0 ${2 + (glowPulse / 40)}px rgba(59, 130, 246, 0.${Math.floor(glowPulse / 15)}))` 
              : `drop-shadow(0 0 1px rgba(0, 0, 0, 0.1))`,
            transform: animationActive ? 'scale(1.03)' : 'scale(1)',
          }}
        />
        
        {/* Bottom animation effect */}
        <div 
          className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600/40 via-blue-400/40 to-blue-600/40 rounded-full opacity-0 transition-opacity duration-500"
          style={{ 
            opacity: animationActive ? 0.9 : glowPulse > 80 ? 0.4 : 0, 
            filter: 'blur(0.5px)',
            transform: `scaleX(${animationActive ? 1 : 0.8})`,
            transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out'
          }}
        />
      </div>
    </div>
  );
}; 