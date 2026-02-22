import { useEffect, useState } from 'react';
import { fetchClients } from '../../api';
import type { Client } from '../../data/mockData';

/**
 * AccuracyHeatmap — pure-CSS grid heatmap showing per-client accuracy
 * across training rounds. No extra npm dependency required.
 */
interface Props { refreshTrigger?: number; }

export default function AccuracyHeatmap({ refreshTrigger = 0 }: Props) {
  const [curves, setCurves] = useState<Record<string, number[]>>({});
  const [clientNames, setClientNames] = useState<string[]>([]);

  useEffect(() => {
    fetchClients().then(res => {
      const c = res.clientAccuracyCurves || {};
      setCurves(c);
      setClientNames(Object.keys(c));
    });
  }, [refreshTrigger]);

  const allValues = Object.values(curves).flat();
  const minVal = allValues.length ? Math.min(...allValues) : 50;
  const maxVal = allValues.length ? Math.max(...allValues) : 100;

  const colorFor = (v: number) => {
    const t = Math.max(0, Math.min(1, (v - minVal) / (maxVal - minVal || 1)));
    // violet-500 (#8b5cf6) → emerald-400 (#34d399)
    const r = Math.round(139 + (52 - 139) * t);
    const g = Math.round(92 + (211 - 92) * t);
    const b = Math.round(246 + (153 - 246) * t);
    return `rgb(${r},${g},${b})`;
  };

  const maxRounds = Math.max(...Object.values(curves).map(c => c.length), 0);
  // Only show last 20 rounds to keep it tight
  const displayRounds = Math.min(maxRounds, 20);
  const startIdx = maxRounds - displayRounds;

  if (!clientNames.length) {
    return (
      <div className="rounded-2xl glass p-5 sm:p-6 animate-pulse">
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="font-semibold dark:text-white text-slate-900">Accuracy Heatmap</h3>
        <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
          Client accuracy per round — last {displayRounds} rounds
        </p>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        {/* Column headers (round numbers) */}
        <div className="flex items-end mb-1 pl-20">
          {Array.from({ length: displayRounds }, (_, i) => (
            <div
              key={i}
              className="flex-shrink-0 text-center"
              style={{ width: 28 }}
            >
              <span className="text-[9px] font-mono dark:text-slate-500 text-slate-400">
                {startIdx + i + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {clientNames.map((name) => {
          const vals = curves[name] || [];
          return (
            <div key={name} className="flex items-center mb-0.5">
              <span className="w-20 flex-shrink-0 text-xs font-medium dark:text-slate-300 text-slate-600 truncate pr-2">
                {name}
              </span>
              <div className="flex gap-px">
                {Array.from({ length: displayRounds }, (_, i) => {
                  const v = vals[startIdx + i];
                  return (
                    <div
                      key={i}
                      className="flex-shrink-0 rounded-sm transition-all duration-300 hover:scale-125 hover:z-10 group relative cursor-default"
                      style={{
                        width: 26,
                        height: 24,
                        backgroundColor: v != null ? colorFor(v) : 'rgba(148,163,184,0.1)',
                        opacity: v != null ? 0.85 : 0.3,
                      }}
                      title={v != null ? `R${startIdx + i + 1}: ${v.toFixed(1)}%` : '—'}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20">
                        <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          {v != null ? `${v.toFixed(1)}%` : '—'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] dark:text-slate-500 text-slate-400">{minVal.toFixed(0)}%</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{
            background: `linear-gradient(to right, ${colorFor(minVal)}, ${colorFor((minVal + maxVal) / 2)}, ${colorFor(maxVal)})`,
          }}
        />
        <span className="text-[10px] dark:text-slate-500 text-slate-400">{maxVal.toFixed(0)}%</span>
      </div>
    </div>
  );
}
