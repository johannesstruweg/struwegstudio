import React, { useEffect, useRef, useState } from 'react';

const StudioStruweg = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) : 0;
      setScrollDepth(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to 65% of viewport
    const updateSize = () => {
      const size = Math.min(window.innerWidth, window.innerHeight) * 0.65;
      canvas.width = size;
      canvas.height = size;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const width = canvas.width;
    const height = canvas.height;

    const POINTS = 1000;
    const RADIUS = Math.min(width, height) * 0.44;
    
    // Color shifts based on scroll depth
    const getColor = () => {
      const hue = 220 - (scrollDepth * 80); // Blue -> Purple -> Pink
      const saturation = 70 + (scrollDepth * 20);
      return `hsl(${hue}, ${saturation}%, 60%)`;
    };
    
    const points = [];
    let t = 0;

    let isDragging = false;
    let lastX = 0, lastY = 0;
    let velocityX = 0, velocityY = 0;
    let rotX = 0, rotY = 0;
    const baseRotY = 0.002;
    const mouse = { x: 0, y: 0, active: false };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;

      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        velocityY = -dx * 0.002;
        velocityX = dy * 0.002;

        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleMouseDown = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseLeave = () => {
      isDragging = false;
      mouse.active = false;
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      isDragging = true;
      lastX = touch.clientX;
      lastY = touch.clientY;
      
      const rect = canvas.getBoundingClientRect();
      mouse.x = touch.clientX - rect.left;
      mouse.y = touch.clientY - rect.top;
      mouse.active = true;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouse.x = touch.clientX - rect.left;
      mouse.y = touch.clientY - rect.top;
      mouse.active = true;

      if (isDragging) {
        const dx = touch.clientX - lastX;
        const dy = touch.clientY - lastY;

        velocityY = -dx * 0.002;
        velocityX = dy * 0.002;

        lastX = touch.clientX;
        lastY = touch.clientY;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
      mouse.active = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchcancel", handleTouchEnd);

    // Build points in sphere
    for (let i = 0; i < POINTS; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      const r = RADIUS * Math.cbrt(Math.random());
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);
      points.push({ x, y, z, offsetX: 0, offsetY: 0 });
    }

    function project(p, rotY, rotX) {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      let x = p.x * cosY + p.z * sinY;
      let z = p.z * cosY - p.x * sinY;
      let y = p.y;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      let y2 = y * cosX - z * sinX;
      let z2 = z * cosX + y * sinX;

      const depth = 500;
      const scale = depth / (depth + z2);
      const px = width / 2 + x * scale;
      const py = height / 2 + y2 * scale;
      return { px, py, scale, z: z2 };
    }

    function draw() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, width, height);

      const pulse = Math.sin(t * 0.04) * 0.3 + 0.7;

      rotY += baseRotY + velocityY;
      rotX += velocityX;
      velocityX *= 0.96;
      velocityY *= 0.96;
      rotX = Math.max(Math.min(rotX, Math.PI / 3), -Math.PI / 3);

      const cx = width / 2;
      const cy = height / 2;
      let proximityBoost = 1;
      if (mouse.active) {
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - d / (Math.min(width, height) / 2));
        proximityBoost = 1 + proximity * 2;
        rotY += dx * 0.000001 * proximity;
        rotX -= dy * 0.000001 * proximity;
      }

      const COLOR = getColor();

      for (let i = 0; i < POINTS; i++) {
        const p = points[i];
        const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        const wave = Math.sin(dist / 10 - t * 0.1);
        const amp = wave * 6 * pulse;
        const pr = project({ x: p.x, y: p.y, z: p.z + amp }, rotY, rotX);

        if (mouse.active) {
          const dx = pr.px - mouse.x;
          const dy = pr.py - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const influenceRadius = 220;
          if (d < influenceRadius) {
            const strength = Math.pow(1 - d / influenceRadius, 2.5) * 8 * proximityBoost;
            p.offsetX = (p.offsetX - dx * 0.01 * strength) * 0.9;
            p.offsetY = (p.offsetY - dy * 0.01 * strength) * 0.9;
          } else {
            p.offsetX *= 0.9;
            p.offsetY *= 0.9;
          }
        } else {
          p.offsetX *= 0.9;
          p.offsetY *= 0.9;
        }

        const alpha = 0.25 + 0.75 * (1 - dist / RADIUS);
        const depthBias = Math.pow(pr.scale, 1.5);
        const size = 1.2 * pr.scale * (1 + depthBias * 0.8);

        ctx.beginPath();
        ctx.fillStyle = COLOR;
        ctx.globalAlpha = alpha * pr.scale;
        ctx.arc(pr.px + p.offsetX, pr.py + p.offsetY, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      t += 1;
      animationId = requestAnimationFrame(draw);
    }

    let animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener('resize', updateSize);
    };
  }, [scrollDepth]);

  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden">
      {/* Fixed Canvas Background */}
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
        <canvas
          ref={canvasRef}
          style={{ cursor: "grab" }}
          className="opacity-70"
        />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 text-white pointer-events-none">
        {/* Hero Section - Centered */}
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-tight leading-tight">
              Let's Build Something Intelligent
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-light text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Systems that adapt. Designs that respond. Experiences that emerge.
            </p>
            <div className="pt-8 pointer-events-auto">
              <button className="px-8 py-3 border border-white/40 rounded-full text-base font-light hover:bg-white/5 transition-all">
                Start a Conversation
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pb-8 text-center text-gray-500 text-xs font-light">
          <p>© 2025 Studio Struweg · Intelligent by Design</p>
        </div>
      </div>
    </div>
  );
};

export default StudioStruweg;
