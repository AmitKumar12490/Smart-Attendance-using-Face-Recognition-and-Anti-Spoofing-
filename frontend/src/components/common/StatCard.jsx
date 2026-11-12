import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  color = 'cyan', // 'cyan', 'emerald', 'amber', 'rose', 'purple'
  className = ''
}) => {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/50',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(6,182,212,0.15)]',
      value: 'text-white'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]',
      value: 'text-white'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]',
      value: 'text-white'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/50',
      iconBg: 'bg-rose-500/10 text-rose-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(244,63,94,0.15)]',
      value: 'text-white'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/50',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(139,92,246,0.15)]',
      value: 'text-white'
    },
  }[color] || {
    border: 'border-slate-700/50 hover:border-slate-500',
    iconBg: 'bg-slate-800 text-slate-300',
    glow: '',
    value: 'text-white'
  };

  // Render value with intelligent typography and badge formatting
  const renderFormattedValue = () => {
    if (typeof value === 'string') {
      const upper = value.trim().toUpperCase();

      // Check for security / system health status indicators
      if (upper === 'ATTENTION_REQUIRED' || upper === 'ATTENTION REQUIRED') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span className="truncate">Attention Required</span>
          </span>
        );
      }

      if (upper === 'OPTIMAL' || upper === 'HEALTHY' || upper === 'SECURE') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span className="truncate">Optimal</span>
          </span>
        );
      }

      // Format words with underscores to clean Title Case
      const formatted = value.replace(/_/g, ' ');
      const fontSizeClass =
        formatted.length > 14
          ? 'text-sm sm:text-base font-bold'
          : formatted.length > 8
          ? 'text-lg sm:text-xl font-bold'
          : 'text-2xl lg:text-3xl font-black';

      return <span className={`${fontSizeClass} truncate block`}>{formatted}</span>;
    }

    // Standard numeric or boolean value
    return <span>{value}</span>;
  };

  return (
    <div className={`glass-card p-5 rounded-xl border ${colorMap.border} ${colorMap.glow} flex flex-col justify-between overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block truncate">
            {title}
          </span>
          <div className="mt-1.5 tracking-tight text-white flex items-center min-w-0">
            {renderFormattedValue()}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 sm:p-3 rounded-xl ${colorMap.iconBg} border border-white/5 shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <span className={`font-medium shrink-0 ${trendPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
