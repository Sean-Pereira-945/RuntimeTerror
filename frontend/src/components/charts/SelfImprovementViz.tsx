import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchSelfImprovement } from '../../api';
import type { SelfImprovementPoint } from '../../data/securityMockData';
import { FiTrendingUp, FiTarget, FiZap } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/**
 * SelfImprovementViz — shows how the model improves itself over time:
 * accuracy, loss, F1, precision, recall on one multi-axis chart,
 * plus summary cards for improvement rate and peak metrics.
 */
export default function SelfImprovementViz() {
  const [points, setPoints] = useState<SelfImprovementPoint[]>([]);
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(['accuracy', 'f1', 'loss']));

  useEffect(() => {
    fetchSelfImprovement().then(setPoints);
  }, []);

  const toggleMetric = (m: string) => {
    setActiveMetrics(prev => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });
  };

  if (!points.length) {
    return (
      <div className="rounded-2xl glass p-5 sm:p-6 animate-pulse">
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const latest = points[points.length - 1];
  const first = points[0];
  const improvement = latest.accuracy - first.accuracy;

  const labels = points.map(p => `R${p.round}`);

  const metricDefs: Record<string, { color: string; data: number[]; yAxis: string; label: string }> = {
    accuracy:  { color: '#8b5cf6', data: points.map(p => p.accuracy),     yAxis: 'y',    label: 'Accuracy (%)' },
    f1:        { color: '#06b6d4', data: points.map(p => p.f1),           yAxis: 'y',    label: 'F1 Score' },
    precision: { color: '#10b981', data: points.map(p => p.precision),    yAxis: 'y',    label: 'Precision' },
    recall:    { color: '#f59e0b', data: points.map(p => p.recall),       yAxis: 'y',    label: 'Recall' },
    loss:      { color: '#ec4899', data: points.map(p => p.loss),         yAxis: 'loss', label: 'Loss' },
  };

  const datasets = Object.entries(metricDefs)
    .filter(([key]) => activeMetrics.has(key))
    .map(([key, def]) => ({
      label: def.label,
      data: def.data,
      borderColor: def.color,
      backgroundColor: key === 'accuracy' ? def.color + '20' : 'transparent',
      fill: key === 'accuracy',
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: def.color,
      borderWidth: key === 'accuracy' ? 2.5 : 2,
      borderDash: key === 'loss' ? [5, 5] : undefined,
      yAxisID: def.yAxis,
    }));

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' as const },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#fff',
        bodyColor: 'rgba(148,163,184,0.9)',
        borderColor: 'rgba(139,92,246,0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148,163,184,0.06)' },
        ticks: {
          color: 'rgba(148,163,184,0.5)',
          font: { family: 'JetBrains Mono, monospace', size: 10 },
          maxTicksLimit: 12,
        },
      },
      y: {
        position: 'left' as const,
        min: 40,
        max: 100,
        grid: { color: 'rgba(148,163,184,0.06)' },
        ticks: {
          color: 'rgba(148,163,184,0.5)',
          font: { family: 'JetBrains Mono, monospace', size: 10 },
          callback: (v: number | string) => v + '%',
        },
      },
      loss: {
        position: 'right' as const,
        min: 0,
        max: 3,
        grid: { display: false },
        ticks: {
          color: 'rgba(236,72,153,0.5)',
          font: { family: 'JetBrains Mono, monospace', size: 10 },
        },
      },
    },
  };

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold dark:text-white text-slate-900 flex items-center gap-2">
            <FiTrendingUp className="text-violet-400" /> Self-Improvement Tracker
          </h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Model performance evolution across {points.length} federated rounds
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">
            <FiTarget size={12} />{latest.accuracy.toFixed(1)}%
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 text-xs font-medium">
            <FiZap size={12} />+{improvement.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(metricDefs).map(([key, def]) => (
          <button
            key={key}
            onClick={() => toggleMetric(key)}
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all duration-200 ${
              activeMetrics.has(key)
                ? 'bg-white/10 dark:text-white text-slate-900 shadow-sm'
                : 'bg-white/[.03] dark:text-slate-500 text-slate-400 hover:bg-white/[.06]'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeMetrics.has(key) ? def.color : 'rgba(148,163,184,0.3)' }} />
            {def.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-72">
        <Line data={chartData} options={options as any} />
      </div>

      {/* Improvement stats */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[.05]">
        <MiniStat label="Peak Accuracy" value={`${Math.max(...points.map(p => p.accuracy)).toFixed(1)}%`} color="text-violet-400" />
        <MiniStat label="Min Loss" value={Math.min(...points.map(p => p.loss)).toFixed(3)} color="text-pink-400" />
        <MiniStat label="Learning Rate" value={latest.learningRate.toExponential(1)} color="text-cyan-400" />
      </div>
    </div>
  );
}


function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <span className="text-[10px] dark:text-slate-500 text-slate-400 block">{label}</span>
      <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
    </div>
  );
}
