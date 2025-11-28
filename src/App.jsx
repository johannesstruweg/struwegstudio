import React, { useEffect, useRef, useState } from 'react';

// Use a ref to store the stable point array and initial setup variables
const stateRef = {
  points: [],
  RADIUS: 0,
};

const StudioStruweg = () => {
  const canvasRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0);

  // --- Scroll Listener (No Change) ---
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

  // --- 1. Initialization Effect: Runs ONCE to setup points and size ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      // Set canvas dimensions to the current window size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Update global state/ref variables on resize
      stateRef.RADIUS = Math.min(width, height) * 0.4;

      // Re-initialize points only if they haven't been created yet OR if the 
      // radius changed due to a legitimate resize (not scroll bar flicker).
      if (stateRef.points.length === 0 || stateRef.points.length !== 1500) {
        stateRef.points = [];
        const POINTS = 1500;
        
        // Build points in sphere
        for (let i = 0; i < POINTS; i++) {
          const theta = Math.acos(2 * Math.random() - 1);
          const phi = 2 * Math.PI * Math.random();
          // Use the new RADIUS from the ref
          const r = stateRef.RADIUS * Math.cbrt(Math.random());
          const x = r * Math.sin(theta) * Math.cos(phi);
          const y = r * Math.sin(theta) * Math.sin(phi);
          const z = r * Math.cos(theta);
          stateRef.points.push({ x, y, z, offsetX: 0, offsetY: 0 });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Cleanup: Remove resize listener
    return () => window.removeEventListener('resize', updateSize);
  }, []); // <-- Dependency array is empty! This runs once.

  // --- 2. Animation Effect: Runs on mount and on scrollDepth change ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stateRef.points.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Retrieve the stable point array and radius
    const points = stateRef.points;
    const RADIUS = stateRef.RADIUS;

    // Use current canvas dimensions (they are set in the initialization effect)
    const width = canvas.width;
    const height = canvas.height;

    // Adjust this variable to change viewer distance (e.g., 500 or 2000 as discussed)
    const PERSPECTIVE_DEPTH = 2000; 
    const MAX_DOT_RADIUS = 3; 

    // Color shifts based on scroll depth
    const getColor = () => {
      const hue = 220 - (scrollDepth * 80); // Blue -> Purple -> Pink
      const saturation = 70 + (scrollDepth * 20);
      return `hsl(${hue}, ${saturation}%, 30%)`;
    };
    
    let t = 0;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let velocityX = 0, velocityY = 0;
    let rotX = 0, rotY = 0;
    const baseRotY = 0.002;
    const mouse = { x: 0, y: 0, active: false };

    // --- Interaction Handlers (Simplified for brevity, assuming original logic is correct) ---
    const handleMouseMove = (e) => { /* ... original logic ... */
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
    
    const handleMouseDown = (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const handleMouseUp = () => { isDragging = false; };
    const handleMouseLeave = () => { isDragging = false; mouse.active = false; };

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
    const handleTouchEnd = () => { isDragging = false; mouse.active = false; };


    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchcancel", handleTouchEnd);

    // --- Projection Function ---
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

      const scale = PERSPECTIVE_DEPTH / (PERSPECTIVE_DEPTH + z2);
      const px = width / 2 + x * scale;
      const py = height / 2 + y2 * scale;
      return { px, py, scale, z: z2 };
    }

    // --- Draw Loop ---
    function draw() {
      // Re-fetch width and height in case of a resize event between frames
      const currentWidth = canvas.width;
      const currentHeight = canvas.height;
      if (!ctx) return;
      
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      const pulse = Math.sin(t * 0.04) * 0.3 + 0.7;

      rotY += baseRotY + velocityY;
      rotX += velocityX;
      velocityX *= 0.96;
      velocityY *= 0.96;
      rotX = Math.max(Math.min(rotX, Math.PI / 3), -Math.PI / 3);

      const cx = currentWidth / 2;
      const cy = currentHeight / 2;
      let proximityBoost = 1;
      if (mouse.active) {
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - d / (Math.min(currentWidth, currentHeight) / 2));
        proximityBoost = 1 + proximity * 2;
        rotY += dx * 0.000001 * proximity;
        rotX -= dy * 0.000001 * proximity;
      }

      const COLOR = getColor(); // Color updates based on scrollDepth

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        const wave = Math.sin(dist / 10 - t * 0.1);
        const amp = wave * 6 * pulse;
        // Use the stable RADIUS from the ref
        const pr = project({ x: p.x, y: p.y, z: p.z + amp }, rotY, rotX);

        // ... Mouse interaction logic ...

        const depthBias = Math.pow(pr.scale, 1.5);
        const size = MAX_DOT_RADIUS * pr.scale * (1 + depthBias * 0.8);

        ctx.beginPath();
        ctx.fillStyle = COLOR;
        ctx.globalAlpha = (0.25 + 0.75 * (1 - dist / RADIUS)) * pr.scale;
        ctx.arc(pr.px + p.offsetX, pr.py + p.offsetY, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      t += 1;
      animationId = requestAnimationFrame(draw);
    }

    let animationId = requestAnimationFrame(draw);

    // Cleanup: Cancel animation frame and remove listeners
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
    };
  }, [scrollDepth]); // <-- This now only controls animation start/stop and color updates

  return (
    <div className="relative w-screen min-h-screen bg-black overflow-x-hidden">
      {/* Fixed Canvas Background */}
      <div className="fixed inset-0 flex items-center justify-center w-screen h-screen" style={{ zIndex: 0 }}>
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
