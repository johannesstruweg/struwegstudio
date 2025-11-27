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
    let particles = [];
    
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

    // Peter de Jong attractor with adaptive parameters
    class Particle {
      constructor() {
        this.x = Math.random() * 4 - 2;
        this.y = Math.random() * 4 - 2;
        this.history = [];
        this.maxHistory = 50;
      }

      update(a, b, c, d) {
        const newX = Math.sin(a * this.y) - Math.cos(b * this.x);
        const newY = Math.sin(c * this.x) - Math.cos(d * this.y);
        
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.maxHistory) {
          this.history.shift();
        }
        
        this.x = newX;
        this.y = newY;
      }

      draw(ctx, centerX, centerY, scale, symmetry, hue, alpha) {
        for (let i = 0; i < symmetry; i++) {
          const angle = (i * Math.PI * 2) / symmetry;
          
          this.history.forEach((pos, index) => {
            const opacity = (index / this.history.length) * alpha;
            const size = 1 + (index / this.history.length) * 1.5;
            
            // Rotate around center
            const rotatedX = pos.x * Math.cos(angle) - pos.y * Math.sin(angle);
            const rotatedY = pos.x * Math.sin(angle) + pos.y * Math.cos(angle);
            
            const screenX = centerX + rotatedX * scale;
            const screenY = centerY + rotatedY * scale;
            
            ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }
    }

    // Initialize particles
    const particleCount = 800;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Fade effect instead of clear for trail
      ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Adaptive parameters based on visitor behavior
      const time = Date.now() * 0.0001;
      
      // Base parameters (Peter de Jong attractor)
      const baseA = -2.0;
      const baseB = -2.0;
      const baseC = 1.2;
      const baseD = 2.0;
      
      // Scroll depth influences parameter drift (0 to 1)
      const scrollInfluence = scrollDepth * 0.5;
      
      // Session time influences complexity (increases slowly)
      const timeInfluence = Math.min(sessionTime / 60, 1) * 0.3;
      
      // Time of day influence (simulated with sine wave)
      const timeOfDay = Math.sin(time * 0.5) * 0.2;
      
      // Adaptive parameters
      const a = baseA + scrollInfluence + timeOfDay;
      const b = baseB + timeInfluence;
      const c = baseC - scrollInfluence * 0.5;
      const d = baseD + Math.sin(time) * 0.3;
      
      // Symmetry increases with engagement
      const symmetry = Math.floor(3 + scrollDepth * 6 + timeInfluence * 3); // 3 to 12-fold
      
      // Color shifts with behavior
      const hue = 200 + scrollDepth * 60 + timeOfDay * 40; // Blue to cyan to purple
      
      // Scale and alpha
      const scale = Math.min(canvas.width, canvas.height) * 0.18;
      const alpha = 0.4 + scrollDepth * 0.3;

      // Update and draw particles
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
              <div>Symmetry: {Math.floor(3 + scrollDepth * 6 + Math.min(sessionTime / 60, 1) * 3)}-fold</div>
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
