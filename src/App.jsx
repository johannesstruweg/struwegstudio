import React, { useEffect, useRef, useState } from 'react';

const IntelligentEmergence = () => {
  const canvasRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
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

    // Particle system with continuous paths (no trails, just flowing points)
    class Particle {
      constructor(index, total) {
        // Distribute particles evenly across the attractor
        const phase = (index / total) * Math.PI * 2;
        this.x = Math.cos(phase) * 2;
        this.y = Math.sin(phase) * 2;
        this.hue = (index / total) * 60; // Slight color variation per particle
      }

      update(a, b, c, d) {
        const newX = Math.sin(a * this.y) - Math.cos(b * this.x);
        const newY = Math.sin(c * this.x) - Math.cos(d * this.y);
        
        this.x = newX;
        this.y = newY;
      }

      draw(ctx, centerX, centerY, scale, symmetry, baseHue, alpha) {
        for (let i = 0; i < symmetry; i++) {
          const angle = (i * Math.PI * 2) / symmetry;
          
          // Rotate around center
          const rotatedX = this.x * Math.cos(angle) - this.y * Math.sin(angle);
          const rotatedY = this.x * Math.sin(angle) + this.y * Math.cos(angle);
          
          const screenX = centerX + rotatedX * scale;
          const screenY = centerY + rotatedY * scale;
          
          const hue = (baseHue + this.hue) % 360;
          
          // Draw as glowing point
          ctx.fillStyle = `hsla(${hue}, 65%, 55%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 1.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Subtle glow
          ctx.fillStyle = `hsla(${hue}, 70%, 65%, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Initialize particles
    const particleCount = 1200;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(i, particleCount));
    }

    // Animation loop with complete redraw (no fading)
    const animate = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Complete clear - no trails, no fading
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Adaptive parameters based on visitor behavior
      const time = Date.now() * 0.00003;
      
      // Base parameters (Peter de Jong attractor)
      const baseA = 1.4;
      const baseB = -2.3;
      const baseC = 2.4;
      const baseD = -2.1;
      
      // Scroll depth influences parameter drift
      const scrollInfluence = scrollDepth * 0.3;
      
      // Session time influences complexity
      const timeInfluence = Math.min(sessionTime / 60, 1) * 0.2;
      
      // Gentle time evolution
      const timeOfDay = Math.sin(time) * 0.1;
      
      // Adaptive parameters
      const a = baseA + scrollInfluence + timeOfDay;
      const b = baseB + timeInfluence * 0.5;
      const c = baseC - scrollInfluence * 0.3;
      const d = baseD + Math.cos(time * 0.7) * 0.15;
      
      // Symmetry increases with engagement
      const symmetry = Math.floor(3 + scrollDepth * 5 + timeInfluence * 4);
      
      // Color shifts with behavior
      const hue = 200 + scrollDepth * 50 + Math.sin(time * 0.5) * 20;
      
      // Scale and alpha
      const scale = Math.min(canvas.width, canvas.height) * 0.2;
      const alpha = 0.4 + scrollDepth * 0.3;

      // Update and draw all particles
      particles.forEach(particle => {
        particle.update(a, b, c, d);
        particle.draw(ctx, centerX, centerY, scale, symmetry, hue, alpha);
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
              <div>Symmetry: {Math.floor(3 + scrollDepth * 5 + Math.min(sessionTime / 60, 1) * 4)}-fold</div>
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
