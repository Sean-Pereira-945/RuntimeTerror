import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { fetchClients } from '../../api';
import type { Client } from '../../data/mockData';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * ContributionRadar — radar chart comparing client contributions
 * across multiple dimensions (accuracy, data-points, rounds, contribution %).
 */
interface Props { refreshTrigger?: number; }

export default function ContributionRadar({ refreshTrigger = 0 }: Props) {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchClients().then(res => setClients(res.clients || []));
  }, [refreshTrigger]);

  // Normalize each dimension to 0–100 for the radar
  const maxDP = Math.max(...clients.map(c => c.dataPoints), 1);
  const maxRounds = Math.max(...clients.map(c => c.roundsParticipated), 1);
  const maxContrib = Math.max(...clients.map(c => c.contribution), 1);

  const labels = ['Accuracy', 'Data Points', 'Rounds', 'Contribution', 'Uptime'];

  const datasets = clients.map((c) => ({
    label: c.shortName,
    data: [
      c.localAccuracy,
      (c.dataPoints / maxDP) * 100,
      (c.roundsParticipated / maxRounds) * 100,
      maxContrib > 0 ? (c.contribution / maxContrib) * 100 : 0,
      c.uptime ?? 0,
    ],
    backgroundColor: c.color + '30',
    borderColor: c.color,
    borderWidth: 2,
    pointBackgroundColor: c.color,
    pointBorderColor: '#fff',
    pointBorderWidth: 1,
    pointRadius: 3,
    pointHoverRadius: 5,
  }));

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeOutQuart' as const },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(148,163,184,0.8)',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { family: 'Inter, system-ui', size: 11 },
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
      },
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(148,163,184,0.08)' },
        grid: { color: 'rgba(148,163,184,0.08)' },
        pointLabels: {
          color: 'rgba(148,163,184,0.7)',
          font: { family: 'Inter', size: 11 },
        },
        ticks: {
          display: false,
          stepSize: 20,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  if (!clients.length) {
    return (
      <div className="rounded-2xl glass p-5 sm:p-6 animate-pulse">
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="font-semibold dark:text-white text-slate-900">Client Contribution Radar</h3>
        <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
          Multi-dimensional comparison across federated clients
        </p>
      </div>
      <div className="h-72 sm:h-80">
        <Radar data={data} options={options as any} />
      </div>
    </div>
  );
}
