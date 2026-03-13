'use client';

import { useEffect, useState, useCallback } from 'react';
import { DailyLog, MealTime, UserProfile, UserSettings, Portions } from '@/lib/types';
import { DAILY_TARGETS, FOOD_GROUPS, sumPortions } from '@/lib/constants';
import { supabaseBrowser, signOut, Session } from '@/lib/auth';
import ProgressCard from './components/ProgressCard';
import MealLogger from './components/MealLogger';
import MealLogItem from './components/MealLogItem';
import CycleIndicator from './components/CycleIndicator';
import WhatsMissing from './components/WhatsMissing';
import MealHistory from './components/MealHistory';
import ChatAssistant from './components/ChatAssistant';
import LoginScreen from './components/LoginScreen';
import SettingsPanel from './components/SettingsPanel';

type Tab = 'hoy' | 'chat' | 'historial';
type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

const NAV_ITEMS: { key: Tab; emoji: string; label: string }[] = [
  { key: 'hoy', emoji: '📊', label: 'Hoy' },
  { key: 'chat', emoji: '💬', label: 'Consúltame' },
  { key: 'historial', emoji: '📅', label: 'Historial' },
];

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

/** Map a UserProfile to the legacy UserSettings shape used by CycleIndicator */
function profileToSettings(profile: UserProfile): UserSettings {
  return {
    id: profile.id,
    cycle_day: profile.current_cycle_day,
    cycle_length: profile.cycle_length,
    updated_at: profile.updated_at,
  };
}

export default function Home() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [session, setSession] = useState<Session | null>(null);

  // ── User data ─────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('hoy');
  const [showSettings, setShowSettings] = useState(false);

  const today = todayStr();
  const token = session?.access_token ?? '';
  const targets: Portions = profile?.daily_targets ?? DAILY_TARGETS;

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    });

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setAuthState(sess ? 'authenticated' : 'unauthenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth header helper ────────────────────────────────────────────────────
  function authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setProfile(await res.json());
  }, [token]);

  const fetchTodayLogs = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`/api/logs?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setLogs(await res.json());
  }, [today, token]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    const start = startDate.toISOString().split('T')[0];
    const res = await fetch(`/api/logs?start=${start}&end=${today}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setHistoryLogs(await res.json());
  }, [today, token]);

  // ── Load data when authenticated ──────────────────────────────────────────
  useEffect(() => {
    if (authState !== 'authenticated') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDataLoading(true);
    Promise.all([fetchProfile(), fetchTodayLogs()]).finally(() => setDataLoading(false));
  }, [authState, fetchProfile, fetchTodayLogs]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === 'historial') fetchHistory();
  }, [tab, fetchHistory]);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleLog(description: string, mealTime: MealTime) {
    const res = await fetch('/api/parse-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
    const res = await fetch(`/api/logs/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleCycleUpdate(cycleDay: number) {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ current_cycle_day: cycleDay }),
    });
    if (res.ok) setProfile(await res.json());
  }

  function handleChatMealLogged(log: DailyLog) {
    setLogs((prev) => [...prev, log]);
  }

  async function handleSignOut() {
    await signOut();
    setProfile(null);
    setLogs([]);
    setHistoryLogs([]);
  }

  // ── Render guards ─────────────────────────────────────────────────────────
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-2">🥗</p>
          <p className="text-sm text-gray-500">Cargando…</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <LoginScreen onLogin={() => setAuthState('authenticated')} />;
  }

  if (dataLoading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-2">🥗</p>
          <p className="text-sm text-gray-500">Cargando tu perfil…</p>
        </div>
      </div>
    );
  }

  const totals = sumPortions(logs);
  const settings: UserSettings = profileToSettings(profile);
  const isChatTab = tab === 'chat';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          profile={profile}
          token={token}
          onSave={setProfile}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-green-700 leading-none">ComeBien</h1>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{formatDate(today)}</p>
          </div>
          {/* User + settings */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full px-2.5 py-1 font-medium truncate max-w-[7rem] active:scale-95 transition-all"
              title="Abrir configuración"
            >
              {profile.name || session?.user?.email?.split('@')[0] || 'Yo'}
            </button>
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              className="text-gray-400 hover:text-gray-600 text-xs px-1.5 py-1 rounded active:scale-95 transition-all"
            >
              ⏏
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        className={`flex-1 max-w-lg mx-auto w-full ${
          isChatTab
            ? 'flex flex-col overflow-hidden px-4 py-4'
            : 'px-4 py-4 flex flex-col gap-4 pb-24'
        }`}
      >
        {tab === 'hoy' && (
          <>
            <CycleIndicator settings={settings} onUpdate={handleCycleUpdate} />

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
                    target={targets[g.key]}
                    unit={g.unit}
                  />
                ))}
              </div>
            </section>

            <WhatsMissing totals={totals} targets={targets} />
            <MealLogger onLog={handleLog} />

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
        )}

        {tab === 'chat' && (
          <ChatAssistant
            currentPortions={totals}
            today={today}
            token={token}
            onMealLogged={handleChatMealLogged}
          />
        )}

        {tab === 'historial' && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Últimos 7 días
            </h2>
            <MealHistory logs={historyLogs} targets={targets} />
          </section>
        )}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-lg mx-auto grid grid-cols-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex flex-col items-center py-2.5 gap-0.5 transition-colors active:scale-95 ${
                tab === item.key ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
