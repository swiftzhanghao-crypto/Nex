import React from 'react';

const WPSLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 260 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="WPS 365"
    >
      <text 
        x="0" 
        y="46" 
        fill="#0062cc" 
        style={{ 
          fontFamily: 'Arial, Helvetica, sans-serif', 
          fontSize: '54px', 
          fontWeight: 400,
          letterSpacing: '-0.5px'
        }}
      >
        WPS 365
      </text>
    </svg>
  );
};

export default WPSLogo;
