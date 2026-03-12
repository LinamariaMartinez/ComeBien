'use client';

import { useEffect, useState, useCallback } from 'react';
import { DailyLog, MealTime, UserSettings } from '@/lib/types';
import { DAILY_TARGETS, FOOD_GROUPS, sumPortions } from '@/lib/constants';
import ProgressCard from './components/ProgressCard';
import MealLogger from './components/MealLogger';
import MealLogItem from './components/MealLogItem';
import CycleIndicator from './components/CycleIndicator';
import WhatsMissing from './components/WhatsMissing';
import MealHistory from './components/MealHistory';

const DEFAULT_SETTINGS: UserSettings = {
  id: 1,
  cycle_day: 1,
  cycle_length: 28,
  updated_at: '',
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function Home() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'hoy' | 'historial'>('hoy');

  const today = todayStr();

  const fetchTodayLogs = useCallback(async () => {
    const res = await fetch(`/api/logs?date=${today}`);
    if (res.ok) setLogs(await res.json());
  }, [today]);

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/settings');
    if (res.ok) setSettings(await res.json());
  }, []);

  const fetchHistory = useCallback(async () => {
    const end = today;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    const start = startDate.toISOString().split('T')[0];
    const res = await fetch(`/api/logs?start=${start}&end=${end}`);
    if (res.ok) setHistoryLogs(await res.json());
  }, [today]);

  useEffect(() => {
    Promise.all([fetchTodayLogs(), fetchSettings()]).finally(() => setLoading(false));
  }, [fetchTodayLogs, fetchSettings]);

  useEffect(() => {
    if (tab === 'historial') fetchHistory();
  }, [tab, fetchHistory]);

  async function handleLog(description: string, mealTime: MealTime) {
    const res = await fetch('/api/parse-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, meal_time: mealTime, date: today }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Error al registrar');
    }
    const newLog: DailyLog = await res.json();
    setLogs((prev) => [...prev, newLog]);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
    if (res.ok) setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleCycleUpdate(cycleDay: number) {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycle_day: cycleDay }),
    });
    if (res.ok) setSettings(await res.json());
  }

  const totals = sumPortions(logs);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-2">🥗</p>
          <p className="text-sm text-gray-500">Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥗</span>
              <div>
                <h1 className="text-base font-bold text-green-700 leading-none">ComeBien</h1>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{formatDate(today)}</p>
              </div>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(['hoy', 'historial'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    tab === t ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {t === 'hoy' ? '📊 Hoy' : '📅 Historial'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4 pb-10">
        {tab === 'hoy' ? (
          <>
            {/* Cycle indicator */}
            <CycleIndicator settings={settings} onUpdate={handleCycleUpdate} />

            {/* Progress grid */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tu progreso de hoy
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {FOOD_GROUPS.map((g) => (
                  <ProgressCard
                    key={g.key}
                    emoji={g.emoji}
                    label={g.label}
                    current={totals[g.key]}
                    target={DAILY_TARGETS[g.key]}
                    unit={g.unit}
                  />
                ))}
              </div>
            </section>

            {/* What's missing */}
            <WhatsMissing totals={totals} />

            {/* Meal logger */}
            <MealLogger onLog={handleLog} />

            {/* Today's logs */}
            {logs.length > 0 ? (
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Comidas de hoy ({logs.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {logs.map((log) => (
                    <MealLogItem key={log.id} log={log} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-3xl mb-2">🍽️</p>
                <p className="text-sm">Sin comidas registradas hoy</p>
                <p className="text-xs mt-1">Describe tu primera comida arriba</p>
              </div>
            )}
          </>
        ) : (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Últimos 7 días
            </h2>
            <MealHistory logs={historyLogs} />
          </section>
        )}
      </main>
    </div>
  );
}
