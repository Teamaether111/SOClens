import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'critical' | 'high' | 'moderate' | 'low' | 'neutral' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'sm', className = '' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'critical':
        return 'bg-red-950/70 text-red-400 border border-red-800/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'high':
        return 'bg-amber-950/70 text-amber-400 border border-amber-700/80';
      case 'moderate':
        return 'bg-yellow-950/60 text-yellow-400 border border-yellow-700/60';
      case 'low':
      case 'success':
        return 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/60';
      case 'info':
        return 'bg-cyan-950/60 text-cyan-400 border border-cyan-700/60';
      default:
        return 'bg-slate-900/80 text-slate-300 border border-slate-700/70';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'lg':
        return 'px-3 py-1 text-xs font-semibold tracking-wider';
      case 'md':
        return 'px-2.5 py-0.5 text-[11px] font-medium tracking-wide';
      case 'sm':
      default:
        return 'px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-sm font-mono ${getSize()} ${getStyles()} ${className}`}>
      {label}
    </span>
  );
};
