import React, { useEffect, useRef, useState } from 'react';

const IntelligentEmergence = () => {
  const canvasRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    
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

    // Single continuous curve that traces the attractor
    class AttractorCurve {
      constructor() {
        this.points = [];
        this.maxPoints = 3000;
        this.x = 0.1;
        this.y = 0.1;
      }

      update(a, b, c, d) {
        const newX = Math.sin(a * this.y) - Math.cos(b * this.x);
        const newY = Math.sin(c * this.x) - Math.cos(d * this.y);
        
        this.x = newX;
        this.y = newY;
        
        this.points.push({ x: this.x, y: this.y });
        
        if (this.points.length > this.maxPoints) {
          this.points.shift();
        }
      }

      draw(ctx, centerX, centerY, scale, symmetry, hue) {
        if (this.points.length < 2) return;
        
        const pointCount = this.points.length;
        
        for (let sym = 0; sym < symmetry; sym++) {
          const angle = (sym * Math.PI * 2) / symmetry;
          
          ctx.beginPath();
          
          for (let i = 0; i < pointCount; i++) {
            const point = this.points[i];
            const opacity = (i / pointCount) * 0.4;
            
            // Rotate point
            const rotX = point.x * Math.cos(angle) - point.y * Math.sin(angle);
            const rotY = point.x * Math.sin(angle) + point.y * Math.cos(angle);
            
            const screenX = centerX + rotX * scale;
            const screenY = centerY + rotY * scale;
            
            if (i === 0) {
              ctx.moveTo(screenX, screenY);
            } else {
              ctx.lineTo(screenX, screenY);
            }
          }
          
          const gradient = ctx.createLinearGradient(centerX - scale, centerY, centerX + scale, centerY);
          gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.05)`);
          gradient.addColorStop(0.5, `hsla(${hue + 20}, 70%, 65%, 0.3)`);
          gradient.addColorStop(1, `hsla(${hue}, 70%, 60%, 0.05)`);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }
    }

    const curve = new AttractorCurve();
    let frameCount = 0;

    const animate = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Very gentle fade for smooth trails
      ctx.fillStyle = 'rgba(10, 10, 15, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Slow, smooth parameter evolution
      const time = Date.now() * 0.00001;
      
      const baseA = 1.4;
      const baseB = -2.3;
      const baseC = 2.4;
      const baseD = -2.1;
      
      const scrollInfluence = scrollDepth * 0.2;
      const timeInfluence = Math.min(sessionTime / 120, 1) * 0.1;
      const drift = Math.sin(time) * 0.05;
      
      const a = baseA + scrollInfluence + drift;
      const b = baseB + timeInfluence;
      const c = baseC - scrollInfluence * 0.2;
      const d = baseD + Math.cos(time * 0.8) * 0.08;
      
      // Gentle symmetry growth
      const symmetry = Math.floor(3 + scrollDepth * 2 + timeInfluence * 2);
      
      // Subtle color shift
      const hue = 200 + scrollDepth * 30 + Math.sin(time * 0.3) * 10;
      
      const scale = Math.min(canvas.width, canvas.height) * 0.25;

      // Update every frame for smooth motion
      curve.update(a, b, c, d);
      
      // Draw every 2 frames to reduce intensity
      if (frameCount % 2 === 0) {
        curve.draw(ctx, centerX, centerY, scale, symmetry, hue);
      }
      
      frameCount++;
      animationRef.current = requestAnimationFrame(animate);
    };

    // Initial dark background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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
              <div>Symmetry: {Math.floor(3 + scrollDepth * 2 + Math.min(sessionTime / 120, 1) * 2)}-fold</div>
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
