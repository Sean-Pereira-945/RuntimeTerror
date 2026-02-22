import { useState, useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import Sidebar from '../components/Sidebar';
import MetricsCard from '../components/MetricsCard';
import AccuracyCurve from '../components/charts/AccuracyCurve';
import ClientComparison from '../components/charts/ClientComparison';
import TrainingHistoryTable from '../components/charts/TrainingHistoryTable';
import AccuracyHeatmap from '../components/charts/AccuracyHeatmap';
import ContributionRadar from '../components/charts/ContributionRadar';
import AttackTimeline from '../components/charts/AttackTimeline';
import SecurityPanel from '../components/charts/SecurityPanel';
import FaultTolerancePanel from '../components/charts/FaultTolerancePanel';
import SelfImprovementViz from '../components/charts/SelfImprovementViz';
import { useAuth } from '../context/AuthContext';
import { fetchMetrics, fetchClients, fetchTrainingStatus, startTraining as apiStartTraining } from '../api';
import type { TrainingStatus } from '../api';
import type { MetricCard, Client } from '../data/mockData';

type DashTab = 'overview' | 'security' | 'faults' | 'improvement';

const TABS: { key: DashTab; label: string; icon: string }[] = [
  { key: 'overview',    label: 'Overview',          icon: '📊' },
  { key: 'security',    label: 'Security & Defence', icon: '🛡️' },
  { key: 'faults',      label: 'Fault Tolerance',   icon: '💓' },
  { key: 'improvement', label: 'Self-Improvement',  icon: '🧠' },
];


export default function AdminDashboard() {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [adminMetrics, setAdminMetrics] = useState<MetricCard[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState<DashTab>('overview');

  // Training status state
  const [trainStatus, setTrainStatus] = useState<TrainingStatus>({ status: 'idle' });
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainMsg, setTrainMsg] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeenStatus = useRef<string>('idle');

  /* ── anime.js refs ── */
  const adminHeaderRef = useRef<HTMLDivElement>(null);
  const adminTabsRef = useRef<HTMLDivElement>(null);
  const adminMetricsGridRef = useRef<HTMLDivElement>(null);
  const adminTrainPanelRef = useRef<HTMLDivElement>(null);
  const adminChartsRow1Ref = useRef<HTMLDivElement>(null);
  const adminChartsRow2Ref = useRef<HTMLDivElement>(null);
  const adminClientsRef = useRef<HTMLDivElement>(null);
  const adminHistoryRef = useRef<HTMLDivElement>(null);

  const refreshDashData = useCallback(() => {
    fetchMetrics().then(data => setAdminMetrics(data.adminMetrics || []));
    fetchClients().then(data => setClients(data.clients || []));
  }, []);

  useEffect(() => {
    refreshDashData();
    // Check training status on mount — if already running, start polling
    fetchTrainingStatus().then(st => {
      setTrainStatus(st);
      lastSeenStatus.current = st.status;
      if (st.status === 'running' || st.status === 'starting') {
        startPolling();
      }
    });
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => {
      clearTimeout(timer);
      if (pollRef.current) clearInterval(pollRef.current);
      if (bgPollRef.current) clearInterval(bgPollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background polling: every 10s detect training started from Client side
  useEffect(() => {
    bgPollRef.current = setInterval(async () => {
      // Skip if already actively polling
      if (pollRef.current) return;
      try {
        const st = await fetchTrainingStatus();
        setTrainStatus(st);
        if (st.status === 'running' || st.status === 'starting') {
          setTrainMsg(st.message ?? 'Training in progress...');
          if (st.totalRounds) {
            setTrainProgress(Math.round((st.currentRound ?? 0) / st.totalRounds * 100));
          }
          startPolling();
        } else if (st.status === 'completed' && lastSeenStatus.current !== 'completed') {
          // Training completed since last check — refresh everything
          refreshDashData();
          setHistoryRefresh(prev => prev + 1);
        }
        lastSeenStatus.current = st.status;
      } catch { /* ignore */ }
    }, 10_000);
    return () => { if (bgPollRef.current) clearInterval(bgPollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── anime.js page entrance timeline ── */
  useEffect(() => {
    const tl = anime.timeline({ easing: 'easeOutExpo' });

    if (adminHeaderRef.current) {
      tl.add({
        targets: adminHeaderRef.current,
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 700,
      }, 50);
    }

    if (adminTabsRef.current) {
      tl.add({
        targets: adminTabsRef.current.children,
        opacity: [0, 1],
        translateY: [15, 0],
        scale: [0.95, 1],
        delay: anime.stagger(60),
        duration: 500,
        easing: 'easeOutBack',
      }, 200);
    }

    if (adminMetricsGridRef.current) {
      tl.add({
        targets: adminMetricsGridRef.current.children,
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.93, 1],
        delay: anime.stagger(90),
        duration: 650,
        easing: 'easeOutBack',
      }, 350);
    }

    if (adminTrainPanelRef.current) {
      tl.add({
        targets: adminTrainPanelRef.current,
        opacity: [0, 1],
        translateY: [25, 0],
        duration: 600,
      }, 600);
    }

    if (adminChartsRow1Ref.current) {
      tl.add({
        targets: adminChartsRow1Ref.current.children,
        opacity: [0, 1],
        translateX: (_el: Element, i: number) => (i === 0 ? [-30, 0] : [30, 0]),
        duration: 700,
        delay: anime.stagger(100),
      }, 800);
    }

    if (adminChartsRow2Ref.current) {
      tl.add({
        targets: adminChartsRow2Ref.current.children,
        opacity: [0, 1],
        translateY: [25, 0],
        delay: anime.stagger(100),
        duration: 600,
      }, 1000);
    }

    if (adminClientsRef.current) {
      tl.add({
        targets: adminClientsRef.current.children,
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.96, 1],
        delay: anime.stagger(80),
        duration: 500,
        easing: 'easeOutBack',
      }, 1150);
    }

    if (adminHistoryRef.current) {
      tl.add({
        targets: adminHistoryRef.current,
        opacity: [0, 1],
        translateY: [25, 0],
        duration: 600,
      }, 1300);
    }

    return () => tl.pause();
  }, []);

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const st = await fetchTrainingStatus();
        setTrainStatus(st);
        if (st.status === 'running' && st.totalRounds) {
          const pct = Math.round((st.currentRound ?? 0) / st.totalRounds * 100);
          setTrainProgress(pct);
          setTrainMsg(st.message ?? `Round ${st.currentRound}/${st.totalRounds}`);
        } else if (st.status === 'completed') {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setTrainProgress(100);
          setTrainMsg('Training complete — model aggregated!');
          lastSeenStatus.current = 'completed';
          // Auto-refresh dashboard data + history table
          refreshDashData();
          setHistoryRefresh(prev => prev + 1);
        } else if (st.status === 'failed') {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setTrainMsg(st.message ?? 'Training failed');
          lastSeenStatus.current = 'failed';
        }
      } catch { /* silently retry */ }
    }, 2000);
  };

  const handleStartTraining = async () => {
    setTrainStatus({ status: 'starting' });
    setTrainProgress(0);
    setTrainMsg('Launching FL simulation...');
    try {
      await apiStartTraining();
      startPolling();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start training';
      setTrainMsg(msg);
      setTrainStatus({ status: 'failed', message: msg });
    }
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-slate-50 transition-colors duration-300">
      <Sidebar />

      {/* Main content */}
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div ref={adminHeaderRef} className={`mb-8`} style={{ opacity: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900">
                Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm dark:text-slate-400 text-slate-500">
                Welcome back, <span className="text-violet-400 font-medium">{user?.name}</span> — here's your federated overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="dark:text-emerald-400 text-emerald-600 font-medium">{clients.length > 0 ? `${clients.filter(c => c.status === 'active').length}/${clients.length} Clients Active` : 'Loading…'}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs dark:text-slate-400 text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div ref={adminTabsRef} className={`flex flex-wrap gap-2 mb-6`}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 dark:text-white text-slate-900 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30'
                  : 'glass dark:text-slate-400 text-slate-500 hover:dark:text-white hover:text-slate-900 hover:shadow-md'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Metrics Grid — always visible */}
        <div ref={adminMetricsGridRef} className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8`}>
          {adminMetrics.map((metric, i) => (
            <div key={metric.id} style={{ opacity: 0 }}>
              <MetricsCard metric={metric} />
            </div>
          ))}
        </div>

        {/* ═══ TAB: Overview ═══ */}
        {activeTab === 'overview' && (
          <>
            {/* Training Control Panel */}
            <div ref={adminTrainPanelRef} className={`mb-8`} style={{ opacity: 0 }}>
              <div className="rounded-2xl glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold dark:text-white text-slate-900 flex items-center gap-2">
                    <span className="text-lg">🚀</span> Federated Training
                  </h3>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    trainStatus.status === 'running' || trainStatus.status === 'starting'
                      ? 'bg-amber-500/15 text-amber-400'
                      : trainStatus.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : trainStatus.status === 'failed'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-slate-500/15 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      trainStatus.status === 'running' || trainStatus.status === 'starting'
                        ? 'bg-amber-500 animate-pulse'
                        : trainStatus.status === 'completed'
                          ? 'bg-emerald-500'
                          : trainStatus.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-slate-500'
                    }`} />
                    {trainStatus.status === 'running' ? 'Training...'
                      : trainStatus.status === 'starting' ? 'Starting...'
                        : trainStatus.status === 'completed' ? 'Complete'
                          : trainStatus.status === 'failed' ? 'Failed'
                            : 'Idle'}
                  </span>
                </div>

                {(trainStatus.status === 'running' || trainStatus.status === 'starting') && (
                  <div className="mb-4 animate-fade-in">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs dark:text-slate-400 text-slate-500">{trainMsg || 'Starting...'}</span>
                      <span className="text-xs font-mono text-violet-400">{Math.round(trainProgress)}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 bg-[length:200%_100%] animate-shimmer transition-all duration-300"
                        style={{ width: `${trainProgress}%` }}
                      />
                    </div>
                    {trainStatus.accuracy != null && (
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs dark:text-slate-400 text-slate-500">Accuracy: <span className="text-emerald-400 font-semibold">{(trainStatus.accuracy * 100).toFixed(1)}%</span></span>
                        {trainStatus.loss != null && (
                          <span className="text-xs dark:text-slate-400 text-slate-500">Loss: <span className="text-amber-400 font-semibold">{trainStatus.loss.toFixed(4)}</span></span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {trainStatus.status === 'completed' && (
                  <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-scale-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-400 text-sm">Training Complete!</div>
                        <div className="text-xs text-emerald-300/70 mt-0.5">Global model aggregated — dashboard data refreshed</div>
                      </div>
                    </div>
                  </div>
                )}

                {trainStatus.status === 'failed' && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {trainMsg || 'Training failed'}
                  </div>
                )}

                <button
                  onClick={handleStartTraining}
                  disabled={trainStatus.status === 'running' || trainStatus.status === 'starting'}
                  className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
                    trainStatus.status === 'completed'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-xl hover:shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:shadow-xl hover:shadow-violet-500/30'
                  }`}
                >
                  {trainStatus.status === 'running' || trainStatus.status === 'starting' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Training in Progress...
                    </span>
                  ) : trainStatus.status === 'completed' ? (
                    'Start Another Round'
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Federated Training
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Charts Row */}
            <div ref={adminChartsRow1Ref} className={`grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8`}>
              <div style={{ opacity: 0 }}>
                <AccuracyCurve refreshTrigger={historyRefresh} />
              </div>
              <div style={{ opacity: 0 }}>
                <ClientComparison refreshTrigger={historyRefresh} />
              </div>
            </div>

            {/* Heatmap + Radar */}
            <div ref={adminChartsRow2Ref} className={`grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8`}>
              <div style={{ opacity: 0 }}>
                <AccuracyHeatmap refreshTrigger={historyRefresh} />
              </div>
              <div style={{ opacity: 0 }}>
                <ContributionRadar refreshTrigger={historyRefresh} />
              </div>
            </div>

            {/* Clients status strip */}
            <div ref={adminClientsRef} className={`grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8`}>
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-2xl glass p-5 flex items-center gap-4 group hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1"
                  style={{ opacity: 0 }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0"
                    style={{ backgroundColor: client.color }}
                  >
                    {client.shortName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm dark:text-white text-slate-900 truncate">{client.shortName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs dark:text-slate-400 text-slate-500">{client.dataPoints.toLocaleString()} records</span>
                      <span className="text-xs text-emerald-400">{client.localAccuracy}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-xs dark:text-slate-500 text-slate-400">{client.lastActive}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Training History Table */}
            <div ref={adminHistoryRef} style={{ opacity: 0 }}>
              <div>
                <TrainingHistoryTable refreshTrigger={historyRefresh} />
              </div>
            </div>
          </>
        )}

        {/* ═══ TAB: Security & Defence ═══ */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
            <SecurityPanel />
            <AttackTimeline />
          </div>
        )}

        {/* ═══ TAB: Fault Tolerance ═══ */}
        {activeTab === 'faults' && (
          <div className="animate-fade-in">
            <FaultTolerancePanel />
          </div>
        )}

        {/* ═══ TAB: Self-Improvement ═══ */}
        {activeTab === 'improvement' && (
          <div className="animate-fade-in">
            <SelfImprovementViz />
          </div>
        )}
      </main>
    </div>
  );
}
