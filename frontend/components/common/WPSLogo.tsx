import React from 'react';
import wps365Logo from '../../assets/wps365-logo.png';

const WPSLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <img
      src={wps365Logo}
      alt="WPS 365"
      className={className}
      draggable={false}
    />
  );
};

export default WPSLogo;
