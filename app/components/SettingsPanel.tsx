'use client';

import { useState, FormEvent } from 'react';
import { UserProfile, Portions } from '@/lib/types';
import { FOOD_GROUPS } from '@/lib/constants';

interface SettingsPanelProps {
  profile: UserProfile;
  token: string;
  onSave: (updated: UserProfile) => void;
  onClose: () => void;
}

export default function SettingsPanel({ profile, token, onSave, onClose }: SettingsPanelProps) {
  const [name, setName] = useState(profile.name ?? '');
  const [cycleDay, setCycleDay] = useState(profile.current_cycle_day ?? 1);
  const [cycleLength, setCycleLength] = useState(profile.cycle_length ?? 28);
  const [targets, setTargets] = useState<Portions>({ ...profile.daily_targets });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleTargetChange(key: keyof Portions, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setTargets((prev) => ({ ...prev, [key]: num }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          current_cycle_day: cycleDay,
          cycle_length: cycleLength,
          daily_targets: targets,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      const updated: UserProfile = await res.json();
      onSave(updated);
      onClose();
    } catch (err) {
      setError('No se pudo guardar. Intenta de nuevo.');
      console.error('Settings save error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800">⚙️ Configuración</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <section>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </section>

            {/* Cycle */}
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Ciclo menstrual
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Día actual</label>
                  <input
                    type="number"
                    min={1}
                    max={cycleLength}
                    value={cycleDay}
                    onChange={(e) => setCycleDay(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Duración (días)</label>
                  <input
                    type="number"
                    min={21}
                    max={35}
                    value={cycleLength}
                    onChange={(e) => setCycleLength(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-center"
                  />
                </div>
              </div>
            </section>

            {/* Daily targets */}
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Metas diarias (porciones)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FOOD_GROUPS.map((g) => (
                  <div key={g.key} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <label className="block text-xs text-gray-500 mb-1">
                      {g.emoji} {g.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={targets[g.key]}
                      onChange={(e) => handleTargetChange(g.key, e.target.value)}
                      className="w-full bg-white rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                ))}
              </div>
            </section>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold text-sm rounded-xl py-3 transition-all disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
