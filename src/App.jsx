import React, { useEffect, useRef, useState } from 'react';

const IntelligentEmergence = () => {
  const canvasRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Responsive canvas sizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
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

    // Vertex shader - processes each point
    const vertexShaderSource = `
      attribute vec2 position;
      uniform float time;
      uniform float scroll;
      uniform float session;
      uniform vec2 resolution;
      varying vec3 vColor;
      
      void main() {
        // Strange attractor parameters (adaptive)
        float a = 1.4 + scroll * 0.2 + sin(time * 0.5) * 0.05;
        float b = -2.3 + session * 0.1;
        float c = 2.4 - scroll * 0.15;
        float d = -2.1 + cos(time * 0.3) * 0.08;
        
        // Compute attractor position
        float x = position.x;
        float y = position.y;
        
        float newX = sin(a * y) - cos(b * x);
        float newY = sin(c * x) - cos(d * y);
        
        // Convert to clip space
        vec2 clipSpace = vec2(newX * 0.22, newY * 0.22);
        gl_Position = vec4(clipSpace, 0.0, 1.0);
        gl_PointSize = 2.0;
        
        // Color based on position and scroll
        float hue = 0.55 + scroll * 0.15 + sin(time * 0.2) * 0.05;
        vColor = vec3(hue, 0.7, 0.6);
      }
    `;

    // Fragment shader - colors each pixel
    const fragmentShaderSource = `
      precision mediump float;
      varying vec3 vColor;
      uniform float alpha;
      
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        float circle = smoothstep(0.5, 0.2, dist);
        
        vec3 rgb = hsv2rgb(vColor);
        gl_FragColor = vec4(rgb, circle * alpha * 0.6);
      }
    `;

    // Compile shader
    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    }

    // Create program
    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Create particle positions
    const numParticles = 800;
    const positions = new Float32Array(numParticles * 2);
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      positions[i * 2] = Math.cos(angle) * 2;
      positions[i * 2 + 1] = Math.sin(angle) * 2;
    }

    // Create buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Set up attributes
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'time');
    const scrollLocation = gl.getUniformLocation(program, 'scroll');
    const sessionLocation = gl.getUniformLocation(program, 'session');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const alphaLocation = gl.getUniformLocation(program, 'alpha');

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Animation loop
    const animate = () => {
      const time = Date.now() * 0.0001;
      
      // Clear with background color
      gl.clearColor(0.039, 0.039, 0.059, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Update uniforms
      gl.uniform1f(timeLocation, time);
      gl.uniform1f(scrollLocation, scrollDepth);
      gl.uniform1f(sessionLocation, Math.min(sessionTime / 60, 1));
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(alphaLocation, 0.4 + scrollDepth * 0.3);

      // Draw points
      gl.drawArrays(gl.POINTS, 0, numParticles);

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
      {/* WebGL Canvas */}
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
