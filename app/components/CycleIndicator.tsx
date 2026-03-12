'use client';

import { useState } from 'react';
import { UserSettings } from '@/lib/types';
import { getCyclePhase } from '@/lib/constants';

interface CycleIndicatorProps {
  settings: UserSettings;
  onUpdate: (cycleDay: number) => void;
}

export default function CycleIndicator({ settings, onUpdate }: CycleIndicatorProps) {
  const [open, setOpen] = useState(false);
  const [inputDay, setInputDay] = useState(String(settings.cycle_day));
  const [saving, setSaving] = useState(false);

  const phase = getCyclePhase(settings.cycle_day);

  async function handleSave() {
    const day = parseInt(inputDay);
    if (isNaN(day) || day < 1 || day > 35) return;
    setSaving(true);
    await onUpdate(day);
    setSaving(false);
    setOpen(false);
  }

  return (
    <div className="rounded-2xl bg-purple-50 border border-purple-100 p-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 text-left"
      >
        <span className="text-lg">{phase.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-purple-800">
            Fase {phase.name} · Día {settings.cycle_day}
          </p>
          <p className="text-xs text-purple-600 truncate">{phase.message}</p>
        </div>
        <span className="text-purple-400 text-xs ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-purple-100">
          <p className="text-xs text-purple-700 mb-2">¿En qué día de tu ciclo estás?</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={35}
              value={inputDay}
              onChange={(e) => setInputDay(e.target.value)}
              className="w-20 text-sm border border-purple-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="Día"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 text-xs bg-purple-500 text-white rounded-lg py-1.5 font-medium disabled:opacity-50 active:scale-95 transition-transform"
            >
              {saving ? 'Guardando…' : 'Actualizar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
