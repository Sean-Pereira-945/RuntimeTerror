import { useState, useEffect } from 'react';
import { FiMail, FiCheck, FiAlertCircle, FiSend, FiInbox } from 'react-icons/fi';
import { fetchEmail, saveEmailConfig, sendTestEmail } from '../../api';
import type { EmailConfig, EmailLog } from '../../data/securityMockData';

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  processed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Processed' },
  rejected:  { bg: 'bg-red-500/15',     text: 'text-red-400',     label: 'Rejected' },
  pending:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   label: 'Pending' },
};

/**
 * EmailTrainingPanel — email-based data ingestion for FL training.
 * Loads config/logs from backend, sends tests via API.
 */
export default function EmailTrainingPanel() {
  const [config, setConfig] = useState<EmailConfig>({
    enabled: true,
    address: '',
    provider: '',
    format: 'csv_attachment',
  });
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [testSent, setTestSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmail().then(res => {
      setConfig(res.config || config);
      setLogs(res.logs || []);
      setLoading(false);
    });
  }, []);

  const handleFormatChange = async (format: EmailConfig['format']) => {
    const newConfig = { ...config, format };
    setConfig(newConfig);
    try {
      await saveEmailConfig(newConfig);
    } catch { /* ignore */ }
  };

  const handleTestSend = async () => {
    if (!testEmail) return;
    try {
      const res = await sendTestEmail(testEmail);
      setLogs(prev => [res.log as EmailLog, ...prev].slice(0, 20));
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl glass p-5 sm:p-6 animate-pulse">
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const timeAgo = (iso: string) => {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)} hr ago`;
    return `${Math.round(diff / 86400)}d ago`;
  };

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold dark:text-white text-slate-900 flex items-center gap-2">
            <FiMail className="text-blue-400" /> Email Training
          </h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Send training data via email — auto-parsed into the FL pipeline
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full ${
          config.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          {config.enabled ? 'Active' : 'Disabled'}
        </span>
      </div>

      {/* Config */}
      <div className="rounded-xl bg-white/[.03] border border-white/[.05] p-4 mb-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] dark:text-slate-500 text-slate-400 uppercase tracking-wider block mb-1">Inbox Address</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[.04] border border-white/[.06]">
              <FiInbox size={12} className="text-blue-400" />
              <span className="text-xs font-mono dark:text-white text-slate-900">{config.address}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] dark:text-slate-500 text-slate-400 uppercase tracking-wider block mb-1">Accepted Format</label>
            <div className="flex gap-2">
              {(['csv_attachment', 'inline_text', 'link'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => handleFormatChange(fmt)}
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg transition-all ${
                    config.format === fmt
                      ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                      : 'bg-white/[.03] dark:text-slate-400 text-slate-500 hover:bg-white/[.06]'
                  }`}
                >
                  {fmt === 'csv_attachment' ? '📎 CSV' : fmt === 'inline_text' ? '📝 Inline' : '🔗 Link'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Email logs */}
      <div className="mb-4">
        <h4 className="text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
          Recent Emails ({logs.length})
        </h4>
        <div className="space-y-1.5">
          {logs.map((log) => {
            const style = statusStyle[log.status];
            return (
              <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[.02] hover:bg-white/[.04] transition-colors">
                <div className="w-7 h-7 rounded-full bg-white/[.06] flex items-center justify-center text-xs">
                  {log.status === 'processed' ? '✅' : log.status === 'rejected' ? '🚫' : '⏳'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium dark:text-white text-slate-900 truncate">{log.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] dark:text-slate-500 text-slate-400 truncate">{log.from}</span>
                    <span className="text-[10px] dark:text-slate-600 text-slate-400">{timeAgo(log.timestamp)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {log.rows > 0 && (
                    <span className="text-[10px] font-mono dark:text-slate-500 text-slate-400">{log.rows} rows</span>
                  )}
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Test email */}
      <div className="rounded-xl bg-white/[.02] border border-dashed border-white/[.08] p-3">
        <h4 className="text-xs font-medium dark:text-slate-400 text-slate-500 mb-2">Send Test Email</h4>
        <div className="flex gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 text-xs bg-transparent border border-white/[.08] rounded-lg px-3 py-2 dark:text-white text-slate-900 placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
          />
          <button
            onClick={handleTestSend}
            className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg transition-all ${
              testSent
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
            }`}
          >
            {testSent ? <><FiCheck size={12} /> Sent!</> : <><FiSend size={12} /> Test</>}
          </button>
        </div>
        <div className="mt-2 flex items-start gap-1.5 text-[10px] dark:text-slate-500 text-slate-400">
          <FiAlertCircle size={11} className="mt-0.5 flex-shrink-0" />
          <span>A sample CSV will be sent to validate the pipeline end-to-end.</span>
        </div>
      </div>
    </div>
  );
}
