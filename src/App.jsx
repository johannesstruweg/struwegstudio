import React, { useEffect, useRef, useState } from 'react';

// Stable Ref for point cloud data and parameters that should not be recalculated on every scroll update.
const stateRef = {
  points: [],
  RADIUS: 0,
};

// Ref to hold dynamic state values (color changes)
const dynamicPropsRef = {
  scrollDepth: 0,
  sessionTime: 0,
};

// Ref to hold dynamic motion state (rotation, drag, velocity)
// This ensures the event listeners modify the same object the draw loop reads from.
const dynamicMotionRef = {
  isDragging: false,
  lastX: 0, 
  lastY: 0,
  velocityX: 0, 
  velocityY: 0,
  rotX: 0, 
  rotY: 0,
  baseRotY: 0.002,
  mouse: { x: 0, y: 0, active: false },
};

// Configuration constants for the point cloud visualization
const PERSPECTIVE_DEPTH = 2000; // Viewer distance (2000 for "further away")
const MAX_DOT_RADIUS = 3;       // Max dot size (3px radius / 6px diameter)
const POINTS = 1500;            // Number of points in the cloud

const IntelligentEmergence = () => {
  const canvasRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0); // Kept for content rendering
  const [sessionTime, setSessionTime] = useState(0); // Kept for content rendering

  // --- 1. Session Timer Effect ---
  // Updates the session time every second and updates the ref.
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => {
        const newTime = prev + 1;
        dynamicPropsRef.sessionTime = newTime; // Update ref for animation pulse
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. Scroll Listener Effect ---
  // Calculates the scroll depth (0 to 1), updates state for UI, and updates the ref for animation.
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) : 0;
      
      // Update ref for animation (seamless color change)
      dynamicPropsRef.scrollDepth = scrolled; 

      // Update state for UI elements (like the 'Depth' counter)
      setScrollDepth(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 3. Initialization Effect: Runs ONCE to setup points and resize listener ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Function to set canvas size and initialize/update RADIUS and POINTS
    const updateSize = () => {
      // Set canvas dimensions to the current window size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Update global state/ref variables on resize
      stateRef.RADIUS = Math.min(width, height) * 0.4;

      // Re-initialize points if they haven't been created yet
      if (stateRef.points.length !== POINTS) {
        stateRef.points = [];
        
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
  }, []); // Dependency array is empty: runs once.

  // --- 4. Animation Effect: Runs ONCE to start the persistent draw loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stateRef.points.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Retrieve the stable point array and radius
    const points = stateRef.points;
    const RADIUS = stateRef.RADIUS;

    // Use current canvas dimensions 
    const width = canvas.width;
    const height = canvas.height;

    // Color shifts based on current ref value (updated by scroll listener)
    const getColor = () => {
      const currentScrollDepth = dynamicPropsRef.scrollDepth;
      const hue = 220 - (currentScrollDepth * 80); // Blue -> Purple -> Pink
      const saturation = 70 + (currentScrollDepth * 20);
      return `hsl(${hue}, ${saturation}%, 30%)`;
    };
    
    let t = 0; // Time counter

    // --- Interaction Handlers (Now directly modifying dynamicMotionRef) ---
    const handleMouseMove = (e) => { 
      const rect = canvas.getBoundingClientRect();
      const mouse = dynamicMotionRef.mouse;

      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;

      if (dynamicMotionRef.isDragging) {
        const dx = e.clientX - dynamicMotionRef.lastX;
        const dy = e.clientY - dynamicMotionRef.lastY;

        dynamicMotionRef.velocityY = -dx * 0.002;
        dynamicMotionRef.velocityX = dy * 0.002;

        dynamicMotionRef.lastX = e.clientX;
        dynamicMotionRef.lastY = e.clientY;
      }
    };
    
    const handleMouseDown = (e) => { 
      dynamicMotionRef.isDragging = true; 
      dynamicMotionRef.lastX = e.clientX; 
      dynamicMotionRef.lastY = e.clientY; 
    };
    const handleMouseUp = () => { 
      dynamicMotionRef.isDragging = false; 
    };
    const handleMouseLeave = () => { 
      dynamicMotionRef.isDragging = false; 
      dynamicMotionRef.mouse.active = false; 
    };

    const handleTouchStart = (e) => { 
        e.preventDefault();
        const touch = e.touches[0];
        const mouse = dynamicMotionRef.mouse;
        dynamicMotionRef.isDragging = true;
        dynamicMotionRef.lastX = touch.clientX;
        dynamicMotionRef.lastY = touch.clientY;
        const rect = canvas.getBoundingClientRect();
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
        mouse.active = true;
    };
    const handleTouchMove = (e) => { 
        e.preventDefault();
        const touch = e.touches[0];
        const mouse = dynamicMotionRef.mouse;
        const rect = canvas.getBoundingClientRect();
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
        mouse.active = true;

        if (dynamicMotionRef.isDragging) {
          const dx = touch.clientX - dynamicMotionRef.lastX;
          const dy = touch.clientY - dynamicMotionRef.lastY;

          dynamicMotionRef.velocityY = -dx * 0.002;
          dynamicMotionRef.velocityX = dy * 0.002;

          dynamicMotionRef.lastX = touch.clientX;
          dynamicMotionRef.lastY = touch.clientY;
        }
    };
    const handleTouchEnd = () => { 
      dynamicMotionRef.isDragging = false; 
      dynamicMotionRef.mouse.active = false; 
    };


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
      // Read motion state from ref
      const { baseRotY, velocityX, velocityY, rotX, rotY, mouse } = dynamicMotionRef;

      // Re-fetch width and height in case of a resize event between frames
      const currentWidth = canvas.width;
      const currentHeight = canvas.height;
      if (!ctx) return;
      
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      // ACCESS REF FOR PULSE/COLOR
      const pulse = Math.sin(t * 0.04 + dynamicPropsRef.sessionTime * 0.01) * 0.3 + 0.7;

      // Update rotation variables directly on the ref
      dynamicMotionRef.rotY += baseRotY + velocityX;
      dynamicMotionRef.rotX += velocityX;
      dynamicMotionRef.velocityX *= 0.96;
      dynamicMotionRef.velocityY *= 0.96;
      dynamicMotionRef.rotX = Math.max(Math.min(dynamicMotionRef.rotX, Math.PI / 3), -Math.PI / 3);

      const cx = currentWidth / 2;
      const cy = currentHeight / 2;
      let proximityBoost = 1;

      if (mouse.active) {
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - d / (Math.min(currentWidth, currentHeight) / 2));
        proximityBoost = 1 + proximity * 2;
        dynamicMotionRef.rotY += dx * 0.000001 * proximity;
        dynamicMotionRef.rotX -= dy * 0.000001 * proximity;
      }

      const COLOR = getColor(); // Color updates based on ref value

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        const wave = Math.sin(dist / 10 - t * 0.1);
        const amp = wave * 6 * pulse;
        
        // Pass the updated rotation values from the ref to project
        const pr = project({ x: p.x, y: p.y, z: p.z + amp }, dynamicMotionRef.rotY, dynamicMotionRef.rotX);

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
  }, []); // Dependency array is EMPTY: runs once.

  return (
    <div className="relative w-screen min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      {/* Fixed Canvas Background */}
      <div className="fixed inset-0 flex items-center justify-center w-screen h-screen opacity-70" style={{ zIndex: 0 }}>
        <canvas
          ref={canvasRef}
          style={{ cursor: "grab" }}
        />
      </div>
            
      {/* Content Layer: ADDED pointer-events-none */}
      <div className="relative z-10 text-white pointer-events-none">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col items-center justify-center px-8">
          <div className="max-w-4xl text-center space-y-6">
            <h1 className="text-7xl md:text-8xl font-light tracking-tight">
              s ‹ tudio › s
            </h1>
            <p className="text-xl md:text-2xl font-light text-gray-300 tracking-wide">
              Systems · Emergence · Transformation
            </p>
            <div className="pt-8 text-xl text-gray-500 font-mono">
              ↓
            </div>
          </div>
        </div>
        
        {/* About Section */}
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-2xl space-y-8 bg-black/30 backdrop-blur-sm p-12 rounded-lg border border-white/10 pointer-events-auto">
            <h2 className="text-4xl font-light">Intelligent Design</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              We create systems that think, adapt, and evolve. The pattern you see isn't just decoration—it's responding to you. Its symmetry grows with your engagement, its colors shift with your journey, its complexity emerges from your curiosity.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              This is design as conversation. Mathematics as communication. Beauty as intelligence.
            </p>
            <div className="pt-6 grid grid-cols-3 gap-6 text-sm font-mono text-gray-400">
              {/* Note: I'm approximating symmetry growth based on available variables */}
              <div>Symmetry: {Math.floor(3 + scrollDepth * 3 + Math.min(sessionTime / 60, 1) * 2)}-fold</div>
              <div>Depth: {Math.floor(scrollDepth * 100)}%</div>
              <div>Time: {Math.floor(sessionTime)}s</div>
            </div>
          </div>
        </div>
        
        {/* Work Section */}
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-3xl space-y-12">
            <h2 className="text-5xl font-light text-center mb-16">Selected Work</h2>
                        <div className="space-y-8 pointer-events-auto">
              {[
                { title: 'Adaptive Systems', desc: 'Platforms that learn and evolve with their users' },
                { title: 'Emergent Interfaces', desc: 'UI that responds to context and intent' },
                { title: 'Computational Design', desc: 'Where algorithm meets aesthetics' }
              ].map((project, i) => (
                <div 
                  key={i}
                  className="bg-black/20 backdrop-blur-sm p-8 rounded-lg border border-white/10 hover:border-white/30 transition-all cursor-pointer"
                >
                  <h3 className="text-2xl font-light mb-3">{project.title}</h3>
                  <p className="text-gray-400">{project.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Contact Section */}
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-2xl text-center space-y-8">
            <h2 className="text-5xl font-light">Let's Build Something Intelligent</h2>
            <p className="text-xl text-gray-300">
              Systems that adapt. Designs that respond. Experiences that emerge.
            </p>
            <div className="pt-8">
              <a 
                href="mailto:hello@studiostruweg.com"
                className="inline-block px-8 py-4 border border-white/30 rounded-full hover:bg-white/10 transition-all text-lg pointer-events-auto"
              >
                Start a Conversation
              </a>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="py-16 text-center text-gray-500 text-sm font-mono">
          <p>© 2025 Studio Struweg · Intelligent by Design</p>
        </div>
      </div>
    </div>
  );
};

export default IntelligentEmergence;
