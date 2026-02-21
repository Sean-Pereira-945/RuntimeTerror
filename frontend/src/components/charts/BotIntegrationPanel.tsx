import { useState, useEffect } from 'react';
import { FiSend, FiMessageCircle, FiCheckCircle, FiCopy, FiExternalLink } from 'react-icons/fi';
import { fetchBots, toggleBot, testBotCommand } from '../../api';
import type { BotPlatform } from '../../data/securityMockData';

const platformEmoji: Record<string, string> = {
  telegram: '✈️',
  whatsapp: '💬',
  discord: '🎮',
};

/**
 * BotIntegrationPanel — shows Telegram/WhatsApp/Discord bot
 * integration. Loads config from backend, toggles and tests via API.
 */
export default function BotIntegrationPanel() {
  const [platforms, setPlatforms] = useState<BotPlatform[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBots().then(res => {
      setPlatforms(res.platforms || []);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const res = await toggleBot(id);
      setPlatforms(res.platforms || platforms);
    } catch {
      // Optimistic local toggle as fallback
      setPlatforms(prev =>
        prev.map(p => (p.id === id ? { ...p, connected: !p.connected } : p))
      );
    }
  };

  const sendTest = async () => {
    if (!testMessage.trim()) return;
    try {
      const res = await testBotCommand(testMessage);
      setTestResult(res.response);
    } catch {
      setTestResult('Error: could not reach bot service.');
    }
  };

  const copyWebhook = (webhook: string, id: string) => {
    navigator.clipboard?.writeText(webhook);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-2xl glass p-5 sm:p-6 animate-pulse">
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="font-semibold dark:text-white text-slate-900 flex items-center gap-2">
          <FiMessageCircle className="text-green-400" /> Bot Integration
        </h3>
        <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
          Train, predict & monitor from Telegram, WhatsApp, or Discord
        </p>
      </div>

      {/* Platform cards */}
      <div className="space-y-3 mb-5">
        {platforms.map((p) => (
          <div
            key={p.id}
            className={`rounded-xl p-4 border transition-all duration-300 ${
              p.connected
                ? 'bg-white/[.04] border-white/[.08]'
                : 'bg-white/[.01] border-white/[.03] opacity-60'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg">{platformEmoji[p.id] || '🤖'}</span>
              <div className="flex-1">
                <span className="text-sm font-medium dark:text-white text-slate-900">{p.name}</span>
              </div>
              <button
                onClick={() => handleToggle(p.id)}
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
                  p.connected
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/[.06] dark:text-slate-400 text-slate-500 hover:bg-white/[.1]'
                }`}
              >
                {p.connected ? <><FiCheckCircle size={12} /> Connected</> : 'Connect'}
              </button>
            </div>

            {p.connected && (
              <div className="mt-2 space-y-2">
                {/* Webhook URL */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono dark:text-slate-500 text-slate-400 truncate flex-1">
                    {p.webhook}
                  </span>
                  <button
                    onClick={() => copyWebhook(p.webhook, p.id)}
                    className="text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {copied === p.id ? <FiCheckCircle size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
                  </button>
                </div>

                {/* Available commands */}
                <div className="flex flex-wrap gap-1.5">
                  {p.commands.map(cmd => (
                    <span
                      key={cmd}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[.04] dark:text-slate-400 text-slate-500"
                    >
                      {cmd}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Test console */}
      <div className="rounded-xl bg-white/[.02] border border-white/[.05] p-4">
        <h4 className="text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
          Bot Console (Simulator)
        </h4>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="/train, /status, /predict, /metrics"
            className="flex-1 text-xs bg-transparent border border-white/[.08] rounded-lg px-3 py-2 dark:text-white text-slate-900 placeholder-slate-500 focus:border-violet-500/50 focus:outline-none font-mono"
            onKeyDown={(e) => e.key === 'Enter' && sendTest()}
          />
          <button
            onClick={sendTest}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-all"
          >
            <FiSend size={12} /> Send
          </button>
        </div>
        {testResult && (
          <div className="p-3 rounded-lg bg-slate-900/50 border border-white/[.05] animate-fade-in">
            <span className="text-[11px] dark:text-slate-300 text-slate-600 font-mono">{testResult}</span>
          </div>
        )}
      </div>
    </div>
  );
}
