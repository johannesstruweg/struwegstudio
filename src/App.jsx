import React, { useEffect, useRef, useState } from 'react';

// --- PathTracer Class (Pure Dots) ---
class PathTracer {
  constructor(index, total) {
    const phase = (index / total) * Math.PI * 2;
    // Initial position slightly dispersed
    this.x = Math.cos(phase) * 0.5; 
    this.y = Math.sin(phase) * 0.5;
    this.prevX = this.x;
    this.prevY = this.y;
  }

  // Time-scaled update for smooth motion (Crucial for silkiness)
  update(a, b, c, d, deltaTime) {
    const substeps = 5; 
    // AGGRESSIVELY increased speed factor (0.3 instead of 0.15)
    // This forces movement out of the central cluster.
    const speedFactor = 0.3 * (deltaTime / 16.666) / substeps; 

    for (let i = 0; i < substeps; i++) {
      this.prevX = this.x;
      this.prevY = this.y;
      
      // The Attractor Equation
      const newX = Math.sin(a * this.y) - Math.cos(b * this.x);
      const newY = Math.sin(c * this.x) - Math.cos(d * this.y);
      
      // Time-scaled integration
      this.x = this.x + (newX - this.x) * speedFactor;
      this.y = this.y + (newY - this.y) * speedFactor;
    }
  }

  // MODIFIED: Draws only a single, solid dot
  draw(ctx, center, scale, symmetry) {
    
    // Ensure absolutely no blur or shadow artifacts
    ctx.shadowBlur = 0; 
    
    // Fixed color for simplicity and high contrast
    ctx.fillStyle = '#66FFFF'; // Bright Cyan
    
    for (let i = 0; i < symmetry; i++) {
      const angle = (i * Math.PI * 2) / symmetry;
      
      const rotate = (px, py, ang) => ({
        x: px * Math.cos(ang) - py * Math.sin(ang),
        y: px * Math.sin(ang) + py * Math.cos(ang),
      });

      const currRot = rotate(this.x, this.y, angle);
      
      const screenX = center.x + currRot.x * scale;
      const screenY = center.y + currRot.y * scale;
      
      // Draw a small, crisp rectangle (dot)
      ctx.fillRect(screenX, screenY, 1.5, 1.5); 
    }
  }
}

// --- React Component (Main Logic) ---
const IntelligentEmergence = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const scrollDepthRef = useRef(0);
  const sessionTimeRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const startTimeRef = useRef(Date.now());

  const [uiParams, setUiParams] = useState({
    symmetry: 3,
    depth: 0,
    time: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // --- Setup Functions ---
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = '#010105'; // Deep black background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) : 0;
      scrollDepthRef.current = scrolled;
    };
    window.addEventListener('scroll', handleScroll);

    const updateSessionTime = () => {
      sessionTimeRef.current = (Date.now() - startTimeRef.current) / 1000;
    };
    const timeInterval = setInterval(updateSessionTime, 100);

    // --- Animation Setup ---
    const particleCount = 2000; 
    const tracers = Array.from({ length: particleCount }, (_, i) => 
      new PathTracer(i, particleCount)
    );
    
    // --- The Animation Loop ---
    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const currentScrollDepth = scrollDepthRef.current;
      const currentSessionTime = sessionTimeRef.current;
      
      // 1. Full Canvas Clear 
      ctx.fillStyle = '#010105'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Adaptive Parameters 
      const globalTime = now * 0.00002;
      
      // Attractor Constants tuned for complexity
      const [baseA, baseB, baseC, baseD] = [1.7, -1.9, 2.2, -1.8]; 
      
      const scrollInfluence = currentScrollDepth * 0.25;
      const timeInfluence = Math.min(currentSessionTime / 60, 1) * 0.2;
      const timeOscillation = Math.sin(globalTime * 0.8) * 0.1;
      
      const a = baseA + scrollInfluence + timeOscillation;
      const b = baseB + timeInfluence * 0.5;
      const c = baseC - currentScrollDepth * 0.25;
      const d = baseD + Math.cos(globalTime * 0.7) * 0.15;
      
      // Visual Parameters 
      // LOCKED Symmetry to 8 for immediate complexity
      const symmetry = 8; 
      const scale = Math.min(canvas.width, canvas.height) * 0.35; // Increased scale for prominence

      // 3. Update UI State (still dynamic based on influence)
      setUiParams({
        symmetry: symmetry,
        depth: Math.floor(currentScrollDepth * 100),
        time: Math.floor(currentSessionTime),
      });

      // 4. Update and Draw Tracers
      const center = { x: centerX, y: centerY };
      tracers.forEach(tracer => {
        tracer.update(a, b, c, d, deltaTime);
        tracer.draw(ctx, center, scale, symmetry); 
      });

      animationRef.current = requestAnimationFrame(animate); 
    };

    animate(); 

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timeInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current); 
      }
    };
  }, []); 

  // --- Render Logic (UI content remains the same) ---
  return (
    <div className="relative w-full min-h-screen bg-[#010105] overflow-x-hidden">
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      <div className="relative z-10 text-white">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col items-center justify-center px-8">
          <div className="max-w-4xl text-center space-y-6">
            <h1 className="text-7xl md:text-8xl font-light tracking-tight">
              Studio Struweg
            </h1>
            <p className="text-xl md:text-2xl font-light text-gray-300 tracking-wide">
              Systems · Emergence · Transformation
            </p>
            <div className="pt-8 text-sm text-gray-500 font-mono">
              Scroll to explore
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-2xl space-y-8 bg-black/30 backdrop-blur-sm p-12 rounded-lg border border-white/10">
            <h2 className="text-4xl font-light">Intelligent Design</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              We create systems that think, adapt, and evolve. The pattern you see isn't just decoration—it's responding to you. Its symmetry grows with your engagement, its colors shift with your journey, its complexity emerges from your curiosity.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              This is design as conversation. Mathematics as communication. Beauty as intelligence.
            </p>
            <div className="pt-6 flex gap-6 text-sm font-mono text-gray-400">
              <div>Symmetry: {uiParams.symmetry}-fold</div>
              <div>Depth: {uiParams.depth}%</div>
              <div>Time: {uiParams.time}s</div>
            </div>
          </div>
        </div>

        {/* Work Section */}
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-3xl space-y-12">
            <h2 className="text-5xl font-light text-center mb-16">Selected Work</h2>
            <div className="space-y-8">
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
                className="inline-block px-8 py-4 border border-white/30 rounded-full hover:bg-white/10 transition-all text-lg"
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
