import React from 'react';

const NeoButton = ({ children, onClick, action = false, className = "", style = {}, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`neo-shadow-sm ${className}`}
      style={{
        padding: '12px 24px',
        borderRadius: '100px',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: 'pointer',
        backgroundColor: action ? '#F5A868' : '#1A1A1A',
        color: action ? '#1A1A1A' : '#FFFFFF',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeoButton;
