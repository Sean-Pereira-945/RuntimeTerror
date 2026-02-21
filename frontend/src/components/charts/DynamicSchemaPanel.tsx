import { useState, useEffect } from 'react';
import { FiDatabase, FiPlus, FiTrash2, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { fetchSchema, saveSchema } from '../../api';
import type { SchemaField } from '../../data/securityMockData';

/**
 * DynamicSchemaPanel — lets users configure the expected CSV schema
 * dynamically. Loads/saves config via the backend API.
 */
export default function DynamicSchemaPanel() {
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [exampleFields, setExampleFields] = useState<SchemaField[]>([]);
  const [newField, setNewField] = useState<SchemaField>({ name: '', type: 'text', required: false, description: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchema().then(res => {
      setFields(res.fields || []);
      setExampleFields(res.exampleFields || []);
      setLoading(false);
    });
  }, []);

  const addField = () => {
    if (!newField.name.trim()) return;
    setFields(prev => [...prev, { ...newField }]);
    setNewField({ name: '', type: 'text', required: false, description: '' });
    setSaved(false);
  };

  const removeField = (idx: number) => {
    // Don't allow removing required base fields
    if (fields[idx].name === 'text' || fields[idx].name === 'label') return;
    setFields(prev => prev.filter((_, i) => i !== idx));
    setSaved(false);
  };

  const addExample = (ex: SchemaField) => {
    if (fields.some(f => f.name === ex.name)) return;
    setFields(prev => [...prev, ex]);
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const res = await saveSchema(fields);
      setFields(res.fields || fields);
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
            <FiDatabase className="text-cyan-400" /> Dynamic Schema
          </h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Configure expected CSV columns for flexible data ingestion
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
          {saved ? 'Saved!' : 'Save Schema'}
        </button>
      </div>

      {/* Current fields */}
      <div className="space-y-2 mb-4">
        {fields.map((field, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[.03] border border-white/[.05] group hover:bg-white/[.05] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-semibold dark:text-white text-slate-900">{field.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[.06] dark:text-slate-400 text-slate-500">
                  {field.type}
                </span>
                {field.required && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">required</span>
                )}
              </div>
              <span className="text-[11px] dark:text-slate-500 text-slate-400">{field.description}</span>
            </div>
            {field.name !== 'text' && field.name !== 'label' && (
              <button
                onClick={() => removeField(idx)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1"
              >
                <FiTrash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quick-add suggestions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[10px] dark:text-slate-500 text-slate-400 self-center">Quick add:</span>
        {exampleFields.filter(ex => !fields.some(f => f.name === ex.name)).map(ex => (
          <button
            key={ex.name}
            onClick={() => addExample(ex)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white/[.04] dark:text-slate-400 text-slate-500 hover:bg-white/[.08] hover:dark:text-white transition-all"
          >
            + {ex.name}
          </button>
        ))}
      </div>

      {/* Add custom field */}
      <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-white/[.02] border border-dashed border-white/[.08]">
        <input
          type="text"
          placeholder="Column name"
          value={newField.name}
          onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
          className="flex-1 min-w-[120px] text-xs bg-transparent border border-white/[.08] rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
        />
        <select
          value={newField.type}
          onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as SchemaField['type'] }))}
          className="text-xs bg-transparent border border-white/[.08] rounded-lg px-2 py-1.5 dark:text-white text-slate-900 focus:border-violet-500/50 focus:outline-none"
        >
          <option value="text">text</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
          <option value="category">category</option>
        </select>
        <button
          onClick={addField}
          disabled={!newField.name.trim()}
          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <FiPlus size={12} /> Add
        </button>
      </div>

      {/* Compatibility notice */}
      <div className="mt-3 flex items-start gap-2 text-[10px] dark:text-slate-500 text-slate-400">
        <FiAlertCircle size={12} className="mt-0.5 flex-shrink-0" />
        <span>Schema changes apply to future uploads. Existing data retains its original structure.</span>
      </div>
    </div>
  );
}
