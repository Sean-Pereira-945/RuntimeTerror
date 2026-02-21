import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { fetchClients } from '../../api';
import type { Client } from '../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ClientComparison() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchClients().then(res => setClients(res.clients || []));
  }, []);

  const data = {
    labels: clients.map((c) => c.shortName),
    datasets: [
      {
        label: 'Local Accuracy (%)',
        data: clients.map((c) => c.localAccuracy),
        backgroundColor: clients.map((c) => c.color + 'cc'),
        borderColor: clients.map((c) => c.color),
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
      },
      {
        label: 'Contribution (%)',
        data: clients.map((c) => c.contribution),
        backgroundColor: clients.map((c) => c.color + '44'),
        borderColor: clients.map((c) => c.color + '88'),
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
      },
    ],
  };

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
          pointStyle: 'roundRect',
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
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: 'rgba(148,163,184,0.7)',
          font: { family: 'Inter', size: 12, weight: '500' as const },
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
        ticks: {
          color: 'rgba(148,163,184,0.5)',
          font: { family: 'JetBrains Mono, monospace', size: 10 },
          callback: (v: number | string) => v + '%',
        },
      },
    },
  };

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="font-semibold dark:text-white text-slate-900">Client Comparison</h3>
        <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
          Local accuracy & contribution per federated client
        </p>
      </div>
      <div className="h-64 sm:h-80">
        <Bar data={data} options={options as any} />
      </div>
    </div>
  );
}
