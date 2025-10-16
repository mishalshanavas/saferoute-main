import React, { useEffect, useRef } from 'react';
import './PixelTrail.css';

const PixelTrail = () => {
  const containerRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create custom cursor
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    cursorRef.current = cursor;

    const createPixel = (x, y) => {
      const pixel = document.createElement('div');
      pixel.className = 'pixel-dot';
      pixel.style.left = `${x - 2}px`;
      pixel.style.top = `${y - 2}px`;
      
      container.appendChild(pixel);
      
      // Remove pixel after animation
      setTimeout(() => {
        if (pixel.parentNode) {
          pixel.parentNode.removeChild(pixel);
        }
      }, 1000);
    };

    const handleMouseMove = (e) => {
      // Update custom cursor position
      if (cursor) {
        cursor.style.left = `${e.clientX - 4}px`;
        cursor.style.top = `${e.clientY - 4}px`;
      }

      // Create pixel trail
      const x = e.clientX;
      const y = e.clientY;
      
      // Create multiple pixels with slight random offset
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          const offsetX = x + (Math.random() - 0.5) * 8;
          const offsetY = y + (Math.random() - 0.5) * 8;
          createPixel(offsetX, offsetY);
        }, i * 80);
      }
    };

    const handleMouseEnter = () => {
      if (cursor) cursor.style.opacity = '1';
      document.body.style.cursor = 'none';
    };

    const handleMouseLeave = () => {
      if (cursor) cursor.style.opacity = '0';
      document.body.style.cursor = 'auto';
    };

    // Add event listeners to document for global mouse tracking
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.body.style.cursor = 'auto';
      
      if (cursor && cursor.parentNode) {
        cursor.parentNode.removeChild(cursor);
      }
    };
  }, []);

  return <div ref={containerRef} className="pixel-trail-container" />;
};

export default PixelTrail;