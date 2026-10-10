import React from 'react';

const NeoCard = ({ children, bg = "#C9B8F5", className = "", style = {}, ...props }) => {
  return (
    <div
      className={`neo-shadow ${className}`}
      style={{
        borderRadius: '24px',
        padding: '24px',
        backgroundColor: bg,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default NeoCard;
