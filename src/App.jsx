import React, { useEffect, useRef, useState } from 'react';

const IntelligentEmergence = () => {
  const canvasRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const lastTimeRef = useRef(Date.now()); // New: Track time for delta calculation

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // --- PathTracer Class with time-dependent update ---
    class PathTracer {
      constructor(index, total) {
        const phase = (index / total) * Math.PI * 2;
        this.x = Math.cos(phase) * 2;
        this.y = Math.sin(phase) * 2;
        this.prevX = this.x;
        this.prevY = this.y;
        this.colorOffset = (index / total) * 30;
      }

      // MODIFIED: Accepts deltaTime for smooth, frame-rate independent movement
      update(a, b, c, d, deltaTime) {
        // Use multiple substeps to approximate continuous integration
        const substeps = 5; 
        // Normalize the delta time to a factor of 60 FPS (1000ms/60 ~= 16.666ms)
        const stepFactor = 0.1 * (deltaTime / 16.666) / substeps; 
        
        for (let i = 0; i < substeps; i++) {
          this.prevX = this.x;
          this.prevY = this.y;
          
          // The Attractor function (similar to the Clifford Attractor)
          const newX = Math.sin(a * this.y) - Math.cos(b * this.x);
          const newY = Math.sin(c * this.x) - Math.cos(d * this.y);
          
          // Smoother integration: move towards the new point, scaled by time
          this.x = this.x + (newX - this.x) * stepFactor;
          this.y = this.y + (newY - this.y) * stepFactor;
        }
      }

      draw(ctx, centerX, centerY, scale, symmetry, baseHue, alpha) {
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < symmetry; i++) {
          const angle = (i * Math.PI * 2) / symmetry;
          
          const prevRotX = this.prevX * Math.cos(angle) - this.prevY * Math.sin(angle);
          const prevRotY = this.prevX * Math.sin(angle) + this.prevY * Math.cos(angle);
          
          const currRotX = this.x * Math.cos(angle) - this.y * Math.sin(angle);
          const currRotY = this.x * Math.sin(angle) + this.y * Math.cos(angle);
          
          const prevScreenX = centerX + prevRotX * scale;
          const prevScreenY = centerY + prevRotY * scale;
          const currScreenX = centerX + currRotX * scale;
          const currScreenY = centerY + currRotY * scale;
          
          const hue = (baseHue + this.colorOffset) % 360;
          
          ctx.strokeStyle = `hsla(${hue}, 65%, 55%, ${alpha * 0.7})`;
          ctx.beginPath();
          ctx.moveTo(prevScreenX, prevScreenY);
          ctx.lineTo(currScreenX, currScreenY);
          ctx.stroke();
        }
      }
    }
    // --- End PathTracer Class ---

    // Responsive canvas sizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track scroll depth
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) : 0;
      setScrollDepth(scrolled);
    };
    window.addEventListener('scroll', handleScroll);

    // Track session time
    const timeInterval = setInterval(() => {
      setSessionTime((Date.now() - startTimeRef.current) / 1000);
    }, 100);

    const particleCount = 400;
    const tracers = [];
    for (let i = 0; i < particleCount; i++) {
      tracers.push(new PathTracer(i, particleCount));
    }
    
    // Initial clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const animate = (timestamp) => {
      const now = Date.now();
      const deltaTime = now - lastTimeRef.current; // Calculate time elapsed
      lastTimeRef.current = now; // Store current time for next frame
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // FIXED: Always apply a small, consistent fade
      ctx.fillStyle = 'rgba(10, 10, 15, 0.015)'; // Consistent fade alpha
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Adaptive parameters - based on total elapsed time, not frame time
      const time = now * 0.00002;
      
      const baseA = 1.4;
      const baseB = -2.3;
      const baseC = 2.4;
      const baseD = -2.1;
      
      const scrollInfluence = scrollDepth * 0.25;
      const timeInfluence = Math.min(sessionTime / 60, 1) * 0.15;
      const timeOfDay = Math.sin(time) * 0.08;
      
      const a = baseA + scrollInfluence + timeOfDay;
      const b = baseB + timeInfluence * 0.4;
      const c = baseC - scrollInfluence * 0.25;
      const d = baseD + Math.cos(time * 0.6) * 0.12;
      
      const symmetry = Math.floor(3 + scrollDepth * 3 + timeInfluence * 2);
      
      const hue = 200 + scrollDepth * 40 + Math.sin(time * 0.4) * 15;
      const scale = Math.min(canvas.width, canvas.height) * 0.22;
      const alpha = 0.35 + scrollDepth * 0.25;

      // MODIFIED: Pass deltaTime to the update function
      tracers.forEach(tracer => {
        tracer.update(a, b, c, d, deltaTime); 
        tracer.draw(ctx, centerX, centerY, scale, symmetry, hue, alpha);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timeInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scrollDepth, sessionTime]);

  // The rest of your component remains the same
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
            <div className="pt-6 flex gap-6 text-sm font-mono text-gray-400">
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
