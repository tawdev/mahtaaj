import { useRef, useEffect, useState } from 'react';
import './ElectricBorder.css';

const ElectricBorder = ({ children, className = '', style = {}, intensity = 0.5, baseFrequency = 0.04, numOctaves = 3 }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial dimensions
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();

    // Resize observer for responsive updates
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`electric-border-container ${className}`}
      style={{
        ...style,
        '--intensity': intensity,
        '--base-frequency': baseFrequency,
        '--num-octaves': numOctaves,
        '--container-width': `${dimensions.width}px`,
        '--container-height': `${dimensions.height}px`,
      }}
    >
      <svg className="electric-border-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <filter id="electric-border-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves={numOctaves}
              result="noise"
              seed="1"
            >
              <animate
                attributeName="baseFrequency"
                values={`${baseFrequency};${baseFrequency * 1.2};${baseFrequency}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={intensity * 40}
              result="displacement"
            />
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="colormatrix"
            />
            <feComposite operator="over" in="SourceGraphic" in2="colormatrix" result="composite" />
          </filter>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          filter="url(#electric-border-filter)"
          rx="12"
        />
      </svg>
      <div className="electric-border-content">
        {children}
      </div>
    </div>
  );
};

export default ElectricBorder;
