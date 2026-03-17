import React, { memo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FinanceCardProps {
  title: string;
  value: string;
  change: string;
  unit: string;
  description: string;
  lastUpdated: string;
  updatedLabel: string;
  delay?: number;
}

/**
 * FinanceCard Component
 * Displays a financial metric with its value, daily change, and a brief description.
 * Uses Framer Motion for entrance animations and Tailwind CSS for styling.
 */
export const FinanceCard = memo(({
  title,
  value,
  change,
  unit,
  description,
  lastUpdated,
  updatedLabel,
  delay = 0
}: FinanceCardProps) => {
  // Determine the trend direction based on the change string
  const isPositive = change.includes('+') || (!change.includes('-') && parseFloat(change) > 0);
  const isNegative = change.includes('-');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
      className="card-glass p-4 sm:p-5 flex flex-col justify-between h-full group relative overflow-hidden rounded-2xl"
      role="region"
      aria-label={`${title}: ${value} ${unit}`}
    >
      {/* Subtle background accent that glows on hover */}
      <div className={`absolute top-0 right-0 w-40 h-40 -mr-20 -mt-20 rounded-full blur-3xl opacity-10 transition-all duration-700 group-hover:opacity-20 group-hover:scale-110 ${isPositive ? 'bg-emerald-400' : isNegative ? 'bg-rose-400' : 'bg-slate-400'}`} />

      <div className="relative z-10">
        {/* Card Header */}
        <div className="col-header mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-ink/10 rounded-full group-hover:bg-ink/30 transition-colors" />
            {title}
          </div>
        </div>

        {/* Value and Unit */}
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <span className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl font-extrabold data-value tracking-tighter modern-title break-all leading-none">
            {value}
          </span>
          <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest shrink-0">{unit}</span>
        </div>

        {/* Change Indicator */}
        <div className={`flex items-center gap-1.5 text-[10px] font-bold mb-4 px-2.5 py-1 rounded-lg w-fit transition-all duration-300 ${isPositive ? 'bg-emerald-500/10 text-emerald-700 group-hover:bg-emerald-500/20' : isNegative ? 'bg-rose-500/10 text-rose-700 group-hover:bg-rose-500/20' : 'bg-slate-500/10 text-slate-700 group-hover:bg-slate-500/20'}`}>
          {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span className="font-mono tracking-tight">{change}</span>
        </div>
      </div>
      
      {/* Card Footer with Description and Metadata */}
      <div className="mt-auto pt-4 border-t border-white/20 relative z-10">
        <p className="text-[13px] text-ink/70 leading-relaxed mb-3 font-medium">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-[9px] uppercase tracking-[0.25em] opacity-30 font-extrabold">
            {updatedLabel}: {lastUpdated}
          </div>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-ink/10" />
            <div className="w-1 h-1 rounded-full bg-ink/20" />
            <div className="w-1 h-1 rounded-full bg-ink/10" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});
