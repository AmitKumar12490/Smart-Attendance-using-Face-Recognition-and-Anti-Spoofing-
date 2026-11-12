import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    present: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    late: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    absent: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    half_day: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    high: 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse',
    critical: 'bg-rose-600/25 text-rose-300 border-rose-500/60 font-black',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    verified: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  }[variant.toLowerCase()] || 'bg-slate-800 text-slate-300 border-slate-700';

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }[size] || 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles} ${sizeStyles} ${className}`}>
      {children}
    </span>
  );
};
