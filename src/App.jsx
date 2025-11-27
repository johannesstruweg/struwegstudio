import React, { useEffect, useRef, useState } from 'react';

// --- 1. PathTracer Class (Outside of Component) ---
// Moving this out improves clarity and prevents unnecessary re-creation.
class PathTracer {
  constructor(index, total) {
    const phase = (index / total) * Math.PI * 2;
    // Start particles slightly offset from the origin
    this.x = Math.cos(phase) * 0.01; 
    this.y = Math.sin(phase) * 0.01;
    this.prevX = this.x;
    this.prevY = this.y;
    this.colorOffset = (index / total) * 30;
  }

  // Update using the difference equation for a smooth, time-scaled step
  update(a, b, c, d, deltaTime) {
    // Substeps and scaling for frame-rate independence (deltaTime is in ms)
    const substeps = 5; 
    const speedFactor = 0.1 * (deltaTime / 16.666) / substeps; 

    for (let i = 0; i < substeps; i++) {
      this.prevX = this.x;
      this.prevY = this.y;
      
      // The Chaotic Attractor function (Clifford/Swirl variant)
      const newX = Math.sin(a * this.y) - Math.cos(b * this.x);
      const newY = Math.sin(c * this.x) - Math.cos(d * this.y);
      
      // Integration step: move towards the new state
      this.x = this.x + (newX - this.x) * speedFactor;
      this.y = this.y + (newY - this.y) * speedFactor;
    }
  }

  // Drawing logic remains clean
  draw(ctx, center, scale, symmetry, baseHue, alpha) {
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < symmetry; i++) {
      const angle = (i * Math.PI * 2) / symmetry;
      
      // Helper function for rotation
      const rotate = (px, py, ang) => ({
        x: px * Math.cos(ang) - py * Math.sin(ang),
        y: px * Math.sin(ang) + py * Math.cos(ang),
      });

      const prevRot = rotate(this.prevX, this.prevY, angle);
      const currRot = rotate(this.x, this.y, angle);
      
      const prevScreenX = center.x + prevRot.x * scale;
      const prevScreenY = center.y + prevRot.y * scale;
      const currScreenX = center.x + currRot.x * scale;
      const currScreenY = center.y + currRot.y * scale;
      
      const hue = (baseHue + this.colorOffset) % 360;
      
      ctx.strokeStyle = `hsla(${hue}, 65%, 55%, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.moveTo(prevScreenX, prevScreenY);
      ctx.lineTo(currScreenX, currScreenY);
      ctx.stroke();
    }
  }
}

// --- 2. React Component ---
const IntelligentEmergence = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Use Refs for animation parameters to avoid re-rendering the effect
  const scrollDepthRef = useRef(0);
  const sessionTimeRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const startTimeRef = useRef(Date.now());

  // State is now only used for UI display, keeping the rendering loop clean
  const [uiParams, setUiParams] = useState({
    symmetry: 3,
    depth: 0,
    time: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Guard clause
    const ctx = canvas.getContext('2d');
    
    // --- Setup Functions ---
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Initial clear on resize
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial call

    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) : 0;
      scrollDepthRef.current = scrolled; // Update ref directly
    };
    window.addEventListener('scroll', handleScroll);

    const updateSessionTime = () => {
      sessionTimeRef.current = (Date.now() - startTimeRef.current) / 1000;
    };
    const timeInterval = setInterval(updateSessionTime, 100);

    // --- Animation Setup ---
    const particleCount = 400;
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
      
      // 1. Gentle Background Fade (Consistent)
      ctx.fillStyle = 'rgba(10, 10, 15, 0.015)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 2. Adaptive Parameters (Cleaned up)
      const globalTime = now * 0.00002;
      
      // Base Attractor Constants
      const [baseA, baseB, baseC, baseD] = [1.4, -2.3, 2.4, -2.1];
      
      // Time/Scroll Influences
      const scrollInfluence = currentScrollDepth * 0.25;
      const timeInfluence = Math.min(currentSessionTime / 60, 1) * 0.15;
      const timeOscillation = Math.sin(globalTime) * 0.08;
      
      // Final Parameters
      const a = baseA + scrollInfluence + timeOscillation;
      const b = baseB + timeInfluence * 0.4;
      const c = baseC - currentScrollDepth * 0.25;
      const d = baseD + Math.cos(globalTime * 0.6) * 0.12;
      
      // Visuals
      const symmetry = Math.floor(3 + currentScrollDepth * 3 + timeInfluence * 2);
      const hue = 200 + currentScrollDepth * 40 + Math.sin(globalTime * 0.4) * 15;
      const scale = Math.min(canvas.width, canvas.height) * 0.22;
      const alpha = 0.35 + currentScrollDepth * 0.25;

      // 3. Update UI State (Less Frequent, only for display)
      setUiParams({
        symmetry: symmetry,
        depth: Math.floor(currentScrollDepth * 100),
        time: Math.floor(currentSessionTime),
      });

      // 4. Update and Draw Tracers
      const center = { x: centerX, y: centerY };
      tracers.forEach(tracer => {
        tracer.update(a, b, c, d, deltaTime);
        tracer.draw(ctx, center, scale, symmetry, hue, alpha);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate(); // Start the loop

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timeInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Dependency array is now empty!

  // --- 3. Render Logic ---
  return (
    <div className="relative w-full min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      {/* Attractor Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      
      {/* Content Layer */}
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
            {/* Displaying state from the animation loop */}
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
