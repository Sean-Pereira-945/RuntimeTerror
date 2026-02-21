import { useState, useEffect } from 'react';
import { FiImage, FiFileText, FiMic, FiLayers, FiCheck } from 'react-icons/fi';
import { fetchMultiModal, saveMultiModal } from '../../api';
import type { ModalityConfig } from '../../data/securityMockData';

const iconMap: Record<string, typeof FiImage> = {
  FiFileText,
  FiImage,
  FiMic,
};

/**
 * MultiModalPanel — configures multi-modal fusion weights.
 * Loads/saves config via the backend API.
 */
export default function MultiModalPanel() {
  const [modalities, setModalities] = useState<ModalityConfig[]>([]);
  const [fusionMethod, setFusionMethod] = useState<'late' | 'early' | 'attention'>('late');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMultiModal().then(res => {
      setModalities(res.modalities || []);
      setFusionMethod((res.fusionMethod as 'late' | 'early' | 'attention') || 'late');
      setLoading(false);
    });
  }, []);

  const toggleModality = (id: string) => {
    setModalities(prev =>
      prev.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
    setSaved(false);
  };

  const setWeight = (id: string, weight: number) => {
    setModalities(prev =>
      prev.map(m => (m.id === id ? { ...m, weight } : m))
    );
    setSaved(false);
  };

  const enabledMods = modalities.filter(m => m.enabled);
  const totalWeight = enabledMods.reduce((s, m) => s + m.weight, 0);

  const handleSave = async () => {
    try {
      const res = await saveMultiModal({ fusionMethod, modalities });
      setModalities(res.modalities || modalities);
      setFusionMethod((res.fusionMethod as 'late' | 'early' | 'attention') || fusionMethod);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaved(false);
    }
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold dark:text-white text-slate-900 flex items-center gap-2">
            <FiLayers className="text-amber-400" /> Multi-Modal Fusion
          </h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Configure data modalities & fusion weights for heterogeneous FL
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
            saved
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
          }`}
        >
          <FiCheck size={12} />
          {saved ? 'Applied!' : 'Apply Config'}
        </button>
      </div>

      {/* Fusion method selector */}
      <div className="flex gap-2 mb-4">
        {(['late', 'early', 'attention'] as const).map(method => (
          <button
            key={method}
            onClick={() => { setFusionMethod(method); setSaved(false); }}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
              fusionMethod === method
                ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                : 'bg-white/[.03] dark:text-slate-400 text-slate-500 hover:bg-white/[.06]'
            }`}
          >
            {method === 'late' ? '🔗 Late Fusion' : method === 'early' ? '🧬 Early Fusion' : '🎯 Attention Fusion'}
          </button>
        ))}
      </div>

      {/* Modality cards */}
      <div className="space-y-3">
        {modalities.map((mod) => {
          const Icon = iconMap[mod.icon] || FiLayers;
          const normalizedWeight = totalWeight > 0 ? (mod.weight / totalWeight) * 100 : 0;

          return (
            <div
              key={mod.id}
              className={`rounded-xl p-4 border transition-all duration-300 ${
                mod.enabled
                  ? 'bg-white/[.04] border-white/[.08] hover:bg-white/[.06]'
                  : 'bg-white/[.01] border-white/[.03] opacity-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {/* Toggle */}
                <button
                  onClick={() => toggleModality(mod.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                    mod.enabled ? 'bg-violet-500' : 'bg-white/[.1]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${
                      mod.enabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>

                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: mod.color + '30' }}>
                  <Icon size={16} style={{ color: mod.color }} />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium dark:text-white text-slate-900">{mod.label}</div>
                  <div className="text-[10px] dark:text-slate-500 text-slate-400">{mod.description}</div>
                </div>

                {mod.enabled && (
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white/[.06]" style={{ color: mod.color }}>
                    {normalizedWeight.toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Weight slider */}
              {mod.enabled && (
                <div className="flex items-center gap-3 mt-2 pl-[52px]">
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={mod.weight}
                    onChange={(e) => setWeight(mod.id, parseFloat(e.target.value))}
                    className="flex-1 h-1 appearance-none rounded-full cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${mod.color} ${mod.weight * 100}%, rgba(148,163,184,0.1) ${mod.weight * 100}%)`,
                    }}
                  />
                  <span className="text-[10px] font-mono dark:text-slate-500 text-slate-400 w-8 text-right">
                    {mod.weight.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 rounded-xl bg-white/[.02] border border-white/[.05]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] dark:text-slate-400 text-slate-500">
            Active: {enabledMods.length}/{modalities.length} modalities · Method: {fusionMethod}
          </span>
          {Math.abs(totalWeight - 1) > 0.01 && enabledMods.length > 0 && (
            <span className="text-[10px] text-amber-400">Weights auto-normalized</span>
          )}
        </div>
        {/* Visual weight distribution */}
        <div className="flex h-2 rounded-full overflow-hidden mt-2 gap-px">
          {enabledMods.map(m => (
            <div
              key={m.id}
              className="rounded-full transition-all duration-500"
              style={{
                width: `${(m.weight / totalWeight) * 100}%`,
                backgroundColor: m.color,
                minWidth: 4,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
