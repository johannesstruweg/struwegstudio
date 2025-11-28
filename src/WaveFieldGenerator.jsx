import React, { useEffect, useRef, useState } from 'react';

// Configuration constants
const GRID_SIZE = 80; // Density of the grid (number of points per side)
const POINT_RADIUS = 1.5; // Base radius of the drawn dots

// Stable Ref for point cloud data and parameters that should not be recalculated on every scroll update.
// This ref holds the dynamic values the animation loop needs.
const dynamicWavePropsRef = {
  frequency: 3.0,
  amplitude: 25,
};


const ComputationalWaveField = () => {
  const canvasRef = useRef(null);
  // State is now only used to update the UI labels next to the sliders
  const [frequency, setFrequency] = useState(dynamicWavePropsRef.frequency); 
  const [amplitude, setAmplitude] = useState(dynamicWavePropsRef.amplitude); 

  // Store the grid state stably across renders
  const gridDataRef = useRef(null);

  // Ref for continuous time (t) in the animation loop
  const tRef = useRef(0);

  // Handler for the frequency slider: updates both state (UI) and ref (animation)
  const handleFrequencyChange = (e) => {
    const newFreq = parseFloat(e.target.value);
    setFrequency(newFreq);
    dynamicWavePropsRef.frequency = newFreq;
  };
  
  // Handler for the amplitude slider: updates both state (UI) and ref (animation)
  const handleAmplitudeChange = (e) => {
    const newAmp = parseFloat(e.target.value);
    setAmplitude(newAmp);
    dynamicWavePropsRef.amplitude = newAmp;
  };

  // --- 1. Initialization and Grid Setup ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Function to set canvas size and initialize the grid
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Initialize the grid layout data only once
      if (!gridDataRef.current) {
        const grid = [];
        for (let i = 0; i < GRID_SIZE; i++) {
          for (let j = 0; j < GRID_SIZE; j++) {
            grid.push({ 
              x: i, 
              y: j, 
              z: 0 
            });
          }
        }
        gridDataRef.current = grid;
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Cleanup: Remove resize listener
    return () => window.removeEventListener('resize', updateSize);
  }, []); // Runs once on mount

  // --- 2. Animation Loop Setup (Decoupled) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridDataRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationId;

    const draw = () => {
      const { width, height } = canvas;
      const grid = gridDataRef.current;
      
      // Clear the canvas
      ctx.fillStyle = '#0a0a0f'; // Dark background
      ctx.fillRect(0, 0, width, height);
      
      // Read dynamic values from ref
      const { frequency: freq, amplitude: amp } = dynamicWavePropsRef;
      const t = tRef.current;

      const offsetX = width / 2 - (GRID_SIZE * 5);
      const offsetY = height / 2 - (GRID_SIZE * 5);
      const cell = Math.min(width, height) / GRID_SIZE * 0.8;

      for (let i = 0; i < grid.length; i++) {
        const p = grid[i];
        
        // --- Core Wave Function (Computational Design) ---
        const displacementX = (p.x - GRID_SIZE / 2) * cell;
        const displacementY = (p.y - GRID_SIZE / 2) * cell;
        
        const wave1 = Math.sin(displacementX * 0.05 * freq + t * 0.05);
        const wave2 = Math.cos(displacementY * 0.05 * freq + t * 0.03);
        const wave3 = Math.sin((displacementX + displacementY) * 0.02 * freq + t * 0.07);

        // Combined vertical displacement (z-axis)
        const zDisplacement = (wave1 + wave2 + wave3) * amp;

        // Projection
        const px = offsetX + p.x * cell;
        const py = offsetY + p.y * cell + zDisplacement;
        
        // Color based on vertical displacement (amplitude/height)
        const colorFactor = (zDisplacement + amp) / (amp * 2); // Normalize from 0 to 1
        const hue = 220 + (colorFactor * 80); // Blue to Magenta
        const lightness = 30 + colorFactor * 20;

        // Draw the point
        ctx.beginPath();
        ctx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;
        ctx.globalAlpha = 0.9;
        ctx.arc(px, py, POINT_RADIUS * (1 + colorFactor * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      tRef.current += 1;
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    // Cleanup: Stop animation
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []); // Empty dependency array: runs once.

  return (
    <div className="w-screen h-screen bg-[#0a0a0f] text-white relative flex flex-col overflow-hidden">
      
      {/* Canvas Layer (Takes full screen) */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      {/* UI Controls (Fixed at the bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-8 bg-black/50 backdrop-blur-md border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-6 sm:gap-12 items-center">
          
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-xl font-light text-white/90">Computational Wave Field</h1>
            <p className="text-sm text-gray-400">Emergent pattern controlled by frequency and amplitude.</p>
          </div>

          {/* Frequency Slider */}
          <div className="w-full sm:w-auto flex-1 flex flex-col items-start sm:items-end">
            <label className="text-sm font-mono text-gray-300 mb-1">Frequency: {frequency.toFixed(2)}</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.05"
              value={frequency}
              onChange={handleFrequencyChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
            />
          </div>

          {/* Amplitude Slider */}
          <div className="w-full sm:w-auto flex-1 flex flex-col items-start sm:items-end">
            <label className="text-sm font-mono text-gray-300 mb-1">Amplitude: {amplitude.toFixed(0)}</label>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={amplitude}
              onChange={handleAmplitudeChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ComputationalWaveField;
