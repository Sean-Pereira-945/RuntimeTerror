import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import type { MetricCard } from '../data/mockData';
import { FiTarget, FiUsers, FiRefreshCw, FiZap } from 'react-icons/fi';
import type { ReactNode } from 'react';

const ICON_MAP: Record<string, ReactNode> = {
  accuracy: <FiTarget className="w-5 h-5" />,
  clients: <FiUsers className="w-5 h-5" />,
  rounds: <FiRefreshCw className="w-5 h-5" />,
  convergence: <FiZap className="w-5 h-5" />,
};

export default function MetricsCard({ metric }: { metric: MetricCard }) {
  const { value, ref } = useAnimatedCounter(
    metric.value,
    2000,
    metric.value % 1 === 0 ? 0 : 1,
  );

  const isPositive = metric.trend >= 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl glass dark:glass hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1">
      {/* Gradient accent top border */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.color} opacity-80`} />

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-highlight-500/20 flex items-center justify-center text-accent-400">
            {ICON_MAP[metric.icon] ?? <FiTarget className="w-5 h-5" />}
          </div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              metric.trend === 0
                ? 'bg-emerald-500/15 text-emerald-400'
                : isPositive
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {metric.trend === 0 ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : isPositive ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {metric.trend === 0 ? 'Stable' : `${Math.abs(metric.trend)}%`}
          </span>
        </div>

        <div className="mb-1">
          <span
            ref={ref}
            className="text-3xl sm:text-4xl font-extrabold dark:text-white text-slate-900 tabular-nums"
          >
            {metric.prefix}
            {value}
            {metric.suffix}
          </span>
        </div>

        <p className="text-sm dark:text-slate-400 text-slate-500">{metric.label}</p>
        <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">{metric.trendLabel}</p>
      </div>

      {/* Hover glow */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
