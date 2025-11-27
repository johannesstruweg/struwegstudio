import React, { useEffect, useRef, useState } from 'react';

// --- PathTracer Class: Now draws points instead of lines and includes glow ---
class PathTracer {
  constructor(index, total) {
    const phase = (index / total) * Math.PI * 2;
    this.x = Math.cos(phase) * 0.1; 
    this.y = Math.sin(phase) * 0.1;
    this.prevX = this.x;
    this.prevY = this.y;
    this.colorOffset = (index / total) * 30;
    this.initialAge = Math.random() * 100; // Give particles a varied start
  }

  update(a, b, c, d, deltaTime) {
    const substeps = 5; 
    // Reduced speedFactor slightly to make structures more defined
    const speedFactor = 0.08 * (deltaTime / 16.666) / substeps; 

    for (let i = 0; i < substeps; i++) {
      this.prevX = this.x;
      this.prevY = this.y;
      
      const newX = Math.sin(a * this.y) - Math.cos(b * this.x);
      const newY = Math.sin(c * this.x) - Math.cos(d * this.y);
      
      this.x = this.x + (newX - this.x) * speedFactor;
      this.y = this.y + (newY - this.y) * speedFactor;
    }
  }

  // MODIFIED: Draw points (circles) instead of lines, with glow effects
  draw(ctx, center, scale, symmetry, baseHue, alpha, time) {
    ctx.lineCap = 'round'; // Still good practice, though not for points
    
    // Calculate a dynamic point size and glow based on movement or time
    const speed = Math.sqrt((this.x - this.prevX)**2 + (this.y - this.prevY)**2);
    const basePointSize = 1.2; 
    const pointSize = basePointSize + Math.min(speed * 200, 2); // Faster points are slightly larger
    const pointAlpha = alpha * (0.5 + Math.min(speed * 100, 0.5)); // Faster points are brighter

    for (let i = 0; i < symmetry; i++) {
      const angle = (i * Math.PI * 2) / symmetry;
      
      const rotate = (px, py, ang) => ({
        x: px * Math.cos(ang) - py * Math.sin(ang),
        y: px * Math.sin(ang) + py * Math.cos(ang),
      });

      const currRot = rotate(this.x, this.y, angle);
      
      // Introduce a subtle "Z-depth" or wobble
      const wobble = Math.sin(time * 0.05 + this.initialAge + i) * 0.2;
      const screenX = center.x + currRot.x * scale * (1 + wobble * 0.1); // Scale slightly with wobble
      const screenY = center.y + currRot.y * scale * (1 + wobble * 0.1);
      
      const hue = (baseHue + this.colorOffset + wobble * 5) % 360; // Subtle hue shift with wobble
      const saturation = 75 + Math.sin(time * 0.02 + i) * 15; // More vibrant
      const lightness = 60 + Math.cos(time * 0.03 + i) * 10; // Dynamic lightness

      const color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${pointAlpha})`;
      
      // --- Holographic Glow Effect ---
      // Draw multiple blurred circles for a glow
      const glowPasses = 3;
      for (let g = 0; g < glowPasses; g++) {
        const glowRadius = pointSize + g * 0.8; // Larger radius for outer glow
        const glowAlpha = pointAlpha / (g + 1) * 0.8; // Fades out
        
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${glowAlpha * 0.4})`; // Inner glow is brighter
        ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${glowAlpha})`;
        ctx.shadowBlur = glowRadius * 1.5; // Controls spread of glow
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw the main bright point on top (no shadow)
      ctx.shadowBlur = 0; // Disable shadow for the main point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, pointSize / 2, 0, Math.PI * 2);
      ctx.fill();
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
      ctx.fillStyle = '#0a0a0f'; // Ensure initial background is dark
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
    const particleCount = 600; // Increased particle count for denser cloud
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
      
      // 1. Background Fade for trails (slightly more transparent for lighter trails)
      ctx.fillStyle = 'rgba(10, 10, 15, 0.02)'; // Slightly increased alpha for denser trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 2. Adaptive Parameters (tuned for "holographic" structure)
      const globalTime = now * 0.00002;
      
      // Tuned base constants for more intricate patterns
      const [baseA, baseB, baseC, baseD] = [1.7, -1.9, 2.2, -1.8]; 
      
      const scrollInfluence = currentScrollDepth * 0.3; // Increased influence
      const timeInfluence = Math.min(currentSessionTime / 60, 1) * 0.2; // Increased influence
      const timeOscillation = Math.sin(globalTime * 0.8) * 0.1; // Slower, more impactful oscillation
      
      // Final Attractor Parameters
      const a = baseA + scrollInfluence + timeOscillation;
      const b = baseB + timeInfluence * 0.5;
      const c = baseC - currentScrollDepth * 0.3;
      const d = baseD + Math.cos(globalTime * 0.7) * 0.15;
      
      // Visual Parameters (tuned for futuristic feel)
      const symmetry = Math.floor(4 + currentScrollDepth * 4 + timeInfluence * 3); // More symmetry
      const baseHue = 220; // Starting with cool blue
      const hue = (baseHue + currentScrollDepth * 60 + Math.sin(globalTime * 0.3) * 30) % 360; // Broader hue shift
      const scale = Math.min(canvas.width, canvas.height) * 0.25; // Slightly larger scale
      const alpha = 0.4 + currentScrollDepth * 0.3; // Brighter points with scroll

      // 3. Update UI State
      setUiParams({
        symmetry: symmetry,
        depth: Math.floor(currentScrollDepth * 100),
        time: Math.floor(currentSessionTime),
      });

      // 4. Update and Draw Tracers
      const center = { x: centerX, y: centerY };
      tracers.forEach(tracer => {
        tracer.update(a, b, c, d, deltaTime);
        tracer.draw(ctx, center, scale, symmetry, hue, alpha, globalTime); // Pass globalTime for wobble
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
