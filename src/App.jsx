import React, { useEffect, useRef, useState } from 'react';
import ComputationalWaveField from './WaveFieldGenerator.jsx';

// Stable Ref for point cloud data (outside component to persist across renders)
const stateRef = {
  points: [],
  RADIUS: 0,
};

// Ref for dynamic color changes
const dynamicPropsRef = {
  scrollDepth: 0,
  sessionTime: 0,
};

// Ref for motion state
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

const PERSPECTIVE_DEPTH = 2000;
const MAX_DOT_RADIUS = 3;
const POINTS = 1500;

const IntelligentEmergence = () => {
  // 1. ALL HOOKS MUST BE DECLARED AT THE TOP LEVEL (UNCONDITIONALLY)
  const canvasRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [view, setView] = useState('home');

  const handleGoHome = () => {
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- EFFECT 1: Session Timer (Runs once on mount) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => {
        const newTime = prev + 1;
        dynamicPropsRef.sessionTime = newTime;
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- EFFECT 2: Scroll Listener ---
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) : 0;
      dynamicPropsRef.scrollDepth = scrolled;
      setScrollDepth(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- EFFECT 3: Point Cloud Initialization & Animation ---
  useEffect(() => {
    // GUARD: Only run this logic if we are on the 'home' view
    if (view !== 'home') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Resize Handler with DPI Scaling
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      
      // Normalize coordinate system to use css pixels
      ctx.scale(dpr, dpr);

      // Set visible size in DOM
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // Use logical window dimensions for calculations
      const width = window.innerWidth;
      const height = window.innerHeight;

      stateRef.RADIUS = Math.min(width, height) * 0.4;
      
      // Initialize points if needed
      if (stateRef.points.length !== POINTS) {
        stateRef.points = [];
        for (let i = 0; i < POINTS; i++) {
          const theta = Math.acos(2 * Math.random() - 1);
          const phi = 2 * Math.PI * Math.random();
          const r = stateRef.RADIUS * Math.cbrt(Math.random());
          stateRef.points.push({
            x: r * Math.sin(theta) * Math.cos(phi),
            y: r * Math.sin(theta) * Math.sin(phi),
            z: r * Math.cos(theta),
            offsetX: 0, offsetY: 0
          });
        }
      }
    };
    
    // Initial setup
    updateSize();
    window.addEventListener('resize', updateSize);

    // 2. Animation Loop Helpers
    const getColor = () => {
      const currentScrollDepth = dynamicPropsRef.scrollDepth;
      // Hue shifts from Blue (220) -> Purple -> Pink
      const hue = 220 - (currentScrollDepth * 80);
      // Saturation increases with scroll
      const saturation = 70 + (currentScrollDepth * 20);
      // Fixed lightness at 30% for deep, rich colors (FIX: was previously using saturation var for lightness)
      return `hsl(${hue}, ${saturation}%, 30%)`;
    };

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
      
      // Project using logical window dimensions
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      return { px: width / 2 + x * scale, py: height / 2 + y2 * scale, scale, z: z2 };
    }

    let t = 0;
    let animationId;

    // 3. The Draw Function
    const draw = () => {
      if (!ctx) return;
      
      // Clear canvas using logical dimensions
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Access Refs
      const { baseRotY, velocityX, velocityY, rotX, rotY, mouse } = dynamicMotionRef;
      const pulse = Math.sin(t * 0.04 + dynamicPropsRef.sessionTime * 0.01) * 0.3 + 0.7;

      // Update Motion
      dynamicMotionRef.rotY += baseRotY + velocityX;
      dynamicMotionRef.rotX += velocityX;
      dynamicMotionRef.velocityX *= 0.96;
      dynamicMotionRef.velocityY *= 0.96;
      dynamicMotionRef.rotX = Math.max(Math.min(dynamicMotionRef.rotX, Math.PI / 3), -Math.PI / 3);

      // Mouse Interaction
      if (mouse.active) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const cx = width / 2;
        const cy = height / 2;
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - d / (Math.min(width, height) / 2));
        const proximityBoost = 1 + proximity * 2;
        dynamicMotionRef.rotY += dx * 0.000001 * proximity;
        dynamicMotionRef.rotX -= dy * 0.000001 * proximity;
      }

      const COLOR = getColor();
      const points = stateRef.points;
      const RADIUS = stateRef.RADIUS;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        const wave = Math.sin(dist / 10 - t * 0.1);
        const amp = wave * 6 * pulse;
        
        const pr = project({ x: p.x, y: p.y, z: p.z + amp }, dynamicMotionRef.rotY, dynamicMotionRef.rotX);

        // Render Point
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
    };

    // Start Animation
    animationId = requestAnimationFrame(draw);

    // Event Listeners for Interaction
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
    const handleMouseDown = (e) => { dynamicMotionRef.isDragging = true; dynamicMotionRef.lastX = e.clientX; dynamicMotionRef.lastY = e.clientY; };
    const handleMouseUp = () => { dynamicMotionRef.isDragging = false; };
    
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    
    // Cleanup function
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', updateSize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [view]); // Re-run this effect when 'view' changes

  // --- CONDITIONAL RENDERING (AT THE END) ---
  if (view === 'wave') {
    return (
      <div className="fixed inset-0 w-full h-full z-50 bg-[#0a0a0f]">
        <ComputationalWaveField />
        <button
          onClick={handleGoHome}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-white/10 text-white border border-white/30 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all text-sm"
        >
          ← Back to Studio
        </button>
      </div>
    );
  }

  // --- HOME VIEW RENDER ---
  return (
    <div className="relative w-screen min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      <div className="fixed inset-0 flex items-center justify-center w-screen h-screen opacity-70" style={{ zIndex: 0 }}>
        <canvas ref={canvasRef} style={{ cursor: "grab" }} />
      </div>
      <div className="relative z-10 text-white pointer-events-none">
        <div className="min-h-screen flex flex-col items-center justify-center px-8">
          <div className="max-w-4xl text-center space-y-6">
            <h1 className="text-7xl md:text-8xl font-light tracking-tight">s ‹ tudio › s</h1>
            <p className="text-xl md:text-2xl font-light text-gray-300 tracking-wide">Systems · Emergence · Transformation</p>
            <div className="pt-8 text-xl text-gray-500 font-mono">↓</div>
          </div>
        </div>
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-2xl space-y-8 bg-black/30 backdrop-blur-sm p-12 rounded-lg border border-white/10 pointer-events-auto">
            <h2 className="text-4xl font-light">Intelligent Design</h2>
            <p className="text-lg text-gray-300 leading-relaxed">We create systems that think, adapt, and evolve.</p>
            <div className="pt-6 grid grid-cols-3 gap-6 text-sm font-mono text-gray-400">
              <div>Symmetry: {Math.floor(3 + scrollDepth * 3 + Math.min(sessionTime / 60, 1) * 2)}-fold</div>
              <div>Depth: {Math.floor(scrollDepth * 100)}%</div>
              <div>Time: {Math.floor(sessionTime)}s</div>
            </div>
          </div>
        </div>
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-3xl space-y-12">
            <h2 className="text-5xl font-light text-center mb-16">Selected Work</h2>
            <div className="space-y-8 pointer-events-auto">
              {[
                { title: 'Adaptive Systems', desc: 'Platforms that learn and evolve with their users' },
                { title: 'Emergent Interfaces', desc: 'UI that responds to context and intent' },
                { title: 'Computational Design', desc: 'Where algorithm meets aesthetics', action: () => setView('wave') }
              ].map((project, i) => (
                <div 
                  key={i}
                  onClick={project.action || (() => {})} 
                  className={`bg-black/20 backdrop-blur-sm p-8 rounded-lg border border-white/10 hover:border-white/30 transition-all cursor-pointer ${project.action ? 'hover:scale-[1.01] transition-transform' : ''}`}
                >
                  <h3 className="text-2xl font-light mb-3">{project.title}</h3>
                  <p className="text-gray-400">{project.desc}</p>
                  {project.action && <span className="mt-2 inline-block text-sm text-indigo-400">→ View Interactive Demo</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-2xl text-center space-y-8">
            <h2 className="text-5xl font-light">Let's Build Something Intelligent</h2>
            <div className="pt-8">
              <a href="mailto:hello@studiostruweg.com" className="inline-block px-8 py-4 border border-white/30 rounded-full hover:bg-white/10 transition-all text-lg pointer-events-auto">Start a Conversation</a>
            </div>
          </div>
        </div>
        <div className="py-16 text-center text-gray-500 text-sm font-mono"><p>© 2025 Studio Struweg · Intelligent by Design</p></div>
      </div>
    </div>
  );
};
export default IntelligentEmergence;
