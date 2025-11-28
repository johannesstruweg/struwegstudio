import React, { useEffect, useRef, useState } from 'react';

const StudioStruweg = () => {
  const canvasRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to 65% of viewport
    const updateSize = () => {
      const size = Math.min(window.innerWidth, window.innerHeight) * 0.65;
      canvas.width = size;
      canvas.height = size;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    let animationFrameId;
    let t = 0;

    function draw() {
      if (!canvas || !ctx) return;
      
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.min(width, height) * 0.35;
      
      const rings = 25;
      const dotsPerRing = 60;
      const pulse = Math.sin(t * 0.02) * 0.1 + 0.9;
      
      // Color shifts from blue -> purple -> pink as you scroll
      const hue = 220 - (scrollDepth * 80); // 220 (blue) -> 140 (purple/pink)
      const saturation = 70 + (scrollDepth * 20); // More vibrant as you scroll
      
      for (let i = 0; i < rings; i++) {
        const ringRadius = (i / rings) * maxRadius * pulse;
        const numDots = Math.floor(dotsPerRing * Math.sin((i / rings) * Math.PI));
        
        for (let j = 0; j < numDots; j++) {
          const angle = (j / numDots) * Math.PI * 2 + t * 0.001;
          const x = cx + Math.cos(angle) * ringRadius;
          const y = cy + Math.sin(angle) * ringRadius;
          
          const brightness = (0.6 + 0.4 * Math.sin((i / rings) * Math.PI)) * 0.5;
          
          // Color with scroll-based hue shift
          ctx.fillStyle = `hsla(${hue}, ${saturation}%, 60%, ${brightness})`;
          
          const baseSize = 0.7 + 0.7 * Math.sin(t * 0.05 + i * 0.5);
          const size = Math.max(0.75, baseSize);
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      t += 1;
      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [scrollDepth]);

  return (
    <div className="relative w-full min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      {/* Fixed Canvas Background */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
        <canvas
          ref={canvasRef}
          className="opacity-80"
        />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 text-white">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col items-center justify-center px-8">
          <div className="max-w-4xl text-center space-y-6">
            <h1 className="text-7xl md:text-9xl font-light tracking-tight">
              Studio Struweg
            </h1>
            <p className="text-2xl md:text-3xl font-light text-gray-300 tracking-wide">
              Systems · Emergence · Transformation
            </p>
            <div className="pt-12 text-sm text-gray-500 font-mono">
              Scroll to explore
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-2xl space-y-8 bg-black/40 backdrop-blur-md p-12 rounded-2xl border border-white/10">
            <h2 className="text-5xl font-light">Intelligent Design</h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              We create systems that think, adapt, and evolve. The pattern you see isn't just decoration—it's responding to you. 
            </p>
            <p className="text-xl text-gray-300 leading-relaxed">
              Watch how the colors shift as you journey through the page. This is design as conversation. Mathematics as communication. Beauty as intelligence.
            </p>
            <div className="pt-6 text-sm font-mono text-gray-400">
              Scroll depth: {Math.floor(scrollDepth * 100)}%
            </div>
          </div>
        </div>

        {/* Work Section */}
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-3xl w-full space-y-12">
            <h2 className="text-5xl font-light text-center mb-16">Selected Work</h2>
            
            <div className="grid gap-6">
              {[
                { 
                  title: 'Adaptive Systems', 
                  desc: 'Platforms that learn and evolve with their users',
                  tag: 'Product Design'
                },
                { 
                  title: 'Emergent Interfaces', 
                  desc: 'UI that responds to context and intent',
                  tag: 'Experience Design'
                },
                { 
                  title: 'Computational Design', 
                  desc: 'Where algorithm meets aesthetics',
                  tag: 'Creative Technology'
                }
              ].map((project, i) => (
                <div 
                  key={i}
                  className="group bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-white/30 hover:bg-black/40 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-3xl font-light">{project.title}</h3>
                    <span className="text-xs font-mono text-gray-500 group-hover:text-gray-400 transition-colors">
                      {project.tag}
                    </span>
                  </div>
                  <p className="text-lg text-gray-400 group-hover:text-gray-300 transition-colors">
                    {project.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-4xl w-full space-y-16">
            <h2 className="text-5xl font-light text-center">What We Do</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: 'Strategy', items: ['Systems Thinking', 'Product Vision', 'Innovation Consulting'] },
                { title: 'Design', items: ['Interface Design', 'Motion & Interaction', 'Design Systems'] },
                { title: 'Technology', items: ['Generative Systems', 'Data Visualization', 'Performance Optimization'] },
                { title: 'Process', items: ['Research & Discovery', 'Rapid Prototyping', 'Iterative Development'] }
              ].map((service, i) => (
                <div key={i} className="bg-black/20 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                  <h3 className="text-2xl font-light mb-6">{service.title}</h3>
                  <ul className="space-y-3">
                    {service.items.map((item, j) => (
                      <li key={j} className="text-gray-400 flex items-center">
                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-3"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="max-w-2xl text-center space-y-10">
            <h2 className="text-6xl font-light">Let's Build Something Intelligent</h2>
            <p className="text-2xl text-gray-300 leading-relaxed">
              Systems that adapt. Designs that respond. Experiences that emerge.
            </p>
            <div className="pt-8 space-y-6">
              <a 
                href="mailto:hello@studiostruweg.com" 
                className="inline-block px-10 py-5 border-2 border-white/30 rounded-full hover:bg-white/10 hover:border-white/50 transition-all text-xl font-light"
              >
                Start a Conversation
              </a>
              <div className="flex justify-center gap-8 text-sm text-gray-500 font-mono">
                <a href="#" className="hover:text-gray-300 transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-gray-300 transition-colors">Twitter</a>
                <a href="#" className="hover:text-gray-300 transition-colors">Instagram</a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-20 text-center space-y-4">
          <p className="text-gray-500 text-sm font-mono">
            © 2025 Studio Struweg · Intelligent by Design
          </p>
          <p className="text-gray-600 text-xs">
            The pattern responds to your journey
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudioStruweg;
