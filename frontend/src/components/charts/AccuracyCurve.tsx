import { useEffect, useRef, useState } from 'react';
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
import { fetchMetrics } from '../../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props { refreshTrigger?: number; }

export default function AccuracyCurve({ refreshTrigger = 0 }: Props) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [visibleRounds, setVisibleRounds] = useState(40);
  const [dataPayload, setDataPayload] = useState({ accuracyOverRounds: [] as number[], lossOverRounds: [] as number[], roundLabels: [] as string[] });

  useEffect(() => {
    fetchMetrics().then(res => {
      setDataPayload({ accuracyOverRounds: res.accuracyOverRounds || [], lossOverRounds: res.lossOverRounds || [], roundLabels: res.roundLabels || [] });
      setVisibleRounds(40);
    });
  }, [refreshTrigger]);

  const { accuracyOverRounds, lossOverRounds, roundLabels } = dataPayload;

  // Simulate real-time updates
  useEffect(() => {
    if (!accuracyOverRounds || accuracyOverRounds.length === 0) return;
    if (visibleRounds >= accuracyOverRounds.length) return;
    const timer = setTimeout(() => setVisibleRounds((v) => Math.min(v + 1, accuracyOverRounds.length)), 2500);
    return () => clearTimeout(timer);
  }, [visibleRounds, accuracyOverRounds]);

  const data = {
    labels: roundLabels.slice(0, visibleRounds),
    datasets: [
      {
        label: 'Global Accuracy',
        data: accuracyOverRounds.slice(0, visibleRounds),
        borderColor: '#8b5cf6',
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const chart = ctx.chart;
          const { ctx: chartCtx, chartArea } = chart;
          if (!chartArea) return 'rgba(139,92,246,0.1)';
          const gradient = chartCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(139,92,246,0.3)');
          gradient.addColorStop(1, 'rgba(139,92,246,0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#8b5cf6',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: 'Loss',
        data: lossOverRounds.slice(0, visibleRounds),
        borderColor: '#ec4899',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#ec4899',
        borderWidth: 2,
        borderDash: [5, 5],
        yAxisID: 'loss',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' as const },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgba(148,163,184,0.8)',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { family: 'Inter, system-ui', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#fff',
        bodyColor: 'rgba(148,163,184,0.9)',
        borderColor: 'rgba(139,92,246,0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: { family: 'Inter', weight: '600' as const },
        bodyFont: { family: 'Inter' },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
        ticks: {
          color: 'rgba(148,163,184,0.5)',
          font: { family: 'JetBrains Mono, monospace', size: 10 },
          maxTicksLimit: 12,
        },
      },
      y: {
        position: 'left' as const,
        min: 50,
        max: 100,
        grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
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
        grid: { drawOnChartArea: false, drawBorder: false },
        ticks: {
          color: 'rgba(236,72,153,0.5)',
          font: { family: 'JetBrains Mono, monospace', size: 10 },
        },
      },
    },
  };

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold dark:text-white text-slate-900">Accuracy & Loss Curve</h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Global model performance over {visibleRounds} rounds
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs dark:text-emerald-400 text-emerald-600 font-medium">Live</span>
        </div>
      </div>
      <div className="h-64 sm:h-80">
        <Line ref={chartRef} data={data as any} options={options as any} />
      </div>
    </div>
  );
}
