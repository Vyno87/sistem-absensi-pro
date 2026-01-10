import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`glass-panel rounded-2xl p-6 transition-all duration-300 hover:bg-opacity-50 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default GlassCard;
