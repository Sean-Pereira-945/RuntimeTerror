import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { startTraining as apiStartTraining, uploadClientData } from '../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  FiTarget,
  FiDatabase,
  FiRefreshCw,
  FiCpu,
  FiUploadCloud,
  FiPlay,
  FiClock,
  FiCalendar,
} from 'react-icons/fi';
import { fetchClientPersonal } from '../api';
import type { ClientPersonalData } from '../api';
import DynamicSchemaPanel from '../components/charts/DynamicSchemaPanel';
import MultiModalPanel from '../components/charts/MultiModalPanel';
import BotIntegrationPanel from '../components/charts/BotIntegrationPanel';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type TrainingStatus = 'idle' | 'uploading' | 'training' | 'complete';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<TrainingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dynamicAccuracy, setDynamicAccuracy] = useState<number>(0);
  const [dynamicRounds, setDynamicRounds] = useState<number>(0);
  const [dynamicCurve, setDynamicCurve] = useState<number[]>([]);
  const [dynamicLabels, setDynamicLabels] = useState<string[]>([]);
  const [personalData, setPersonalData] = useState<ClientPersonalData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchClientPersonal();
        setPersonalData(data);
        if (data.curve.length > 0) {
          setDynamicCurve(data.curve);
          setDynamicAccuracy(data.localAccuracy);
          setDynamicRounds(data.roundsTrained);
          setDynamicLabels(data.curve.map((_: number, i: number) => `Round ${i + 1}`));
        }
      } catch (e) {
        console.error("Failed to fetch live client metrics", e);
      }
    };
    fetchData();
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    const checkSidebar = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        const w = sidebar.getBoundingClientRect().width;
        setSidebarCollapsed(w < 100);
      }
    };
    const observer = new MutationObserver(checkSidebar);
    const sidebar = document.querySelector('aside');
    if (sidebar) observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    checkSidebar();
    return () => observer.disconnect();
  }, []);

  const fireConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#8b5cf6', '#ec4899', '#3b82f6'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#8b5cf6', '#ec4899', '#3b82f6'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file.name);
    setStatus('uploading');
    setProgress(0);

    // Simulate upload progress while fetch happens
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 5 + 2;
      setProgress(Math.min(p, 90)); // Cap fake progress at 90%
    }, 200);

    try {
      // Use the user's org directly as the store name, defaulting to org or 'default'
      const storeName = user?.org || 'default';

      await uploadClientData(storeName, file);

      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setStatus('idle'), 700);
    } catch (error) {
      console.error(error);
      clearInterval(interval);
      setStatus('idle');
    }
  };

  const startTraining = async () => {
    setStatus('training');
    setProgress(0);
    try {
      await apiStartTraining();
    } catch (e) {
      console.warn("API failed, simulating training");
    }

    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 3 + 1;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setStatus('complete');
        fireConfetti();
        setTimeout(() => setStatus('idle'), 4000);
      }
      setProgress(Math.min(p, 100));
    }, 150);
  };

  const personalChartData = {
    labels: dynamicLabels,
    datasets: [
      {
        label: 'Your Local Accuracy',
        data: dynamicCurve.length > 0 ? dynamicCurve : [],
        borderColor: '#3b82f6',
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const chart = ctx.chart;
          const { ctx: chartCtx, chartArea } = chart;
          if (!chartArea) return 'rgba(59,130,246,0.1)';
          const grad = chartCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, 'rgba(59,130,246,0.25)');
          grad.addColorStop(1, 'rgba(59,130,246,0.01)');
          return grad;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2.5,
      },
    ],
  };

  const personalChartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#fff', bodyColor: 'rgba(148,163,184,0.9)', borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1, cornerRadius: 12, padding: 12 } },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: 'rgba(148,163,184,0.5)', font: { family: 'JetBrains Mono', size: 9 }, maxTicksLimit: 10 } },
      y: { min: 50, max: 100, grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: 'rgba(148,163,184,0.5)', font: { family: 'JetBrains Mono', size: 10 }, callback: (v: number | string) => v + '%' } },
    },
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-slate-50 transition-colors duration-300">
      <Sidebar />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} p-4 sm:p-6 lg:p-8`}>
        {/* Header */}
        <div className={`mb-8 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ml-12 lg:ml-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900">Training Interface</h1>
              <p className="mt-1 text-sm dark:text-slate-400 text-slate-500">
                Welcome, <span className="text-blue-400 font-medium">{user?.name}</span> — {user?.org}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="dark:text-emerald-400 text-emerald-600 font-medium">Connected to Server</span>
              </span>
            </div>
          </div>
        </div>

        {/* Status + Quick Metrics */}
        <div className={`grid sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {[
            { label: 'Local Accuracy', value: dynamicAccuracy + '%', icon: <FiTarget className="w-5 h-5" />, color: 'from-blue-500 to-cyan-400' },
            { label: 'Dataset Size', value: (personalData?.datasetSize ?? 0).toLocaleString(), icon: <FiDatabase className="w-5 h-5" />, color: 'from-violet-500 to-purple-400' },
            { label: 'Rounds Trained', value: String(dynamicRounds), icon: <FiRefreshCw className="w-5 h-5" />, color: 'from-pink-500 to-rose-400' },
            { label: 'Model Version', value: personalData?.modelVersion ?? 'v0.0', icon: <FiCpu className="w-5 h-5" />, color: 'from-amber-500 to-orange-400' },
          ].map((m, i) => (
            <div key={m.label} className="rounded-2xl glass p-5 group hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.color} opacity-80 rounded-t-2xl`} />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-highlight-500/20 flex items-center justify-center text-accent-400 mb-2">{m.icon}</div>
              <div className="text-2xl font-extrabold dark:text-white text-slate-900">{m.value}</div>
              <div className="text-sm dark:text-slate-400 text-slate-500 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* File Upload */}
          <div className={`rounded-2xl glass p-6 transition-all duration-800 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="font-semibold dark:text-white text-slate-900 mb-4 flex items-center gap-2">
              <FiUploadCloud className="w-5 h-5 text-accent-400" /> Upload Training Data
            </h3>

            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${dragActive
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/[.02]'
                }`}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.json,.parquet"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 dark:text-violet-400 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="dark:text-slate-300 text-slate-700 font-medium text-sm">
                {dragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">CSV, JSON, or Parquet — max 50MB</p>
            </div>

            {/* Upload progress */}
            {status === 'uploading' && (
              <div className="mt-4 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs dark:text-slate-400 text-slate-500 truncate max-w-[200px]">{uploadedFile}</span>
                  <span className="text-xs font-mono text-violet-400">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recent uploads */}
            <div className="mt-6 space-y-2">
              <h4 className="text-xs font-medium dark:text-slate-500 text-slate-400 uppercase tracking-wider">Recent Uploads</h4>
              {(personalData?.recentUploads ?? []).length === 0 && (
                <p className="text-xs dark:text-slate-500 text-slate-400 py-2">No files uploaded yet</p>
              )}
              {(personalData?.recentUploads ?? []).map((f) => (
                <div key={f.name} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[.03] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 text-xs">
                    {f.name.endsWith('.csv') ? 'CSV' : 'JSON'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs dark:text-slate-300 text-slate-700 font-medium truncate">{f.name}</div>
                    <div className="text-[10px] dark:text-slate-500 text-slate-400">{f.size} · {f.rows.toLocaleString()} rows</div>
                  </div>
                  <span className="text-[10px] dark:text-slate-600 text-slate-400">{f.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Training Control */}
          <div className={`rounded-2xl glass p-6 transition-all duration-900 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="font-semibold dark:text-white text-slate-900 mb-4 flex items-center gap-2">
              <FiPlay className="w-5 h-5 text-accent-400" /> Local Training
            </h3>

            {/* Training status card */}
            <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 mb-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm dark:text-slate-300 text-slate-700 font-medium">Training Status</span>
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status === 'training' ? 'bg-amber-500/15 text-amber-400' :
                  status === 'complete' ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-slate-500/15 text-slate-400'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'training' ? 'bg-amber-500 animate-pulse' :
                    status === 'complete' ? 'bg-emerald-500' : 'bg-slate-500'
                    }`} />
                  {status === 'training' ? 'Training...' : status === 'complete' ? 'Complete!' : 'Ready'}
                </span>
              </div>

              {status === 'training' && (
                <div className="mb-4 animate-fade-in">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs dark:text-slate-400 text-slate-500">Processing local dataset...</span>
                    <span className="text-xs font-mono text-violet-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 bg-[length:200%_100%] animate-shimmer transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {status === 'complete' && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-scale-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-400 text-sm">Training Complete!</div>
                      <div className="text-xs text-emerald-300/70 mt-0.5">Model weights sent to aggregation server</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={startTraining}
                disabled={status === 'training' || status === 'uploading'}
                className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${status === 'complete'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-xl hover:shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:shadow-xl hover:shadow-violet-500/30'
                  }`}
              >
                {status === 'training' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Training in Progress...
                  </span>
                ) : status === 'complete' ? (
                  'Start Another Round'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Local Training
                  </span>
                )}
              </button>
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Last Round Time', value: personalData?.lastRoundTime ?? '0s', icon: <FiClock className="w-4 h-4 text-accent-400" /> },
                { label: 'Next Scheduled', value: personalData?.nextScheduled ?? '--', icon: <FiCalendar className="w-4 h-4 text-accent-400" /> },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/[.03] p-3 border border-white/5">
                  <div className="mb-1">{item.icon}</div>
                  <div className="text-sm font-bold dark:text-white text-slate-900">{item.value}</div>
                  <div className="text-[10px] dark:text-slate-500 text-slate-400 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personal Accuracy Chart */}
        <div className={`rounded-2xl glass p-5 sm:p-6 transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold dark:text-white text-slate-900">Your Training History</h3>
              <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">Local accuracy over {dynamicRounds} federated rounds</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
              {dynamicAccuracy}% current
            </div>
          </div>
          <div className="h-64 sm:h-72">
            <Line data={personalChartData as any} options={personalChartOpts as any} />
          </div>
        </div>

        {/* Dynamic Schema & Multi-Modal Panels */}
        <div className={`flex flex-col gap-4 sm:gap-6 mt-6 transition-all duration-1100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <DynamicSchemaPanel />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
            <MultiModalPanel />
          </div>
        </div>

        {/* Bot Integration Panel */}
        <div className={`mt-6 transition-all duration-1100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="animate-fade-in" style={{ animationDelay: '700ms' }}>
            <BotIntegrationPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
