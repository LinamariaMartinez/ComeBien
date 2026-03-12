'use client';

import { DailyLog, Portions } from '@/lib/types';
import { DAILY_TARGETS, FOOD_GROUPS, sumPortions } from '@/lib/constants';

interface MealHistoryProps {
  logs: DailyLog[];
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Hoy';
  if (dateStr === yesterdayStr) return 'Ayer';

  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
}

function DaySummary({ date, logs }: { date: string; logs: DailyLog[] }) {
  const totals = sumPortions(logs);
  const completedGroups = FOOD_GROUPS.filter(
    (g) => totals[g.key] >= DAILY_TARGETS[g.key]
  ).length;
  const totalGroups = FOOD_GROUPS.length;

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-800 capitalize">{getDayLabel(date)}</p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            completedGroups === totalGroups
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {completedGroups}/{totalGroups} grupos
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FOOD_GROUPS.map((g) => {
          const val = totals[g.key];
          const target = DAILY_TARGETS[g.key];
          const done = val >= target;
          return (
            <span
              key={g.key}
              className={`inline-flex items-center gap-0.5 text-xs rounded-full px-2 py-0.5 ${
                done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {g.emoji} {+(val).toFixed(1)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function MealHistory({ logs }: MealHistoryProps) {
  const grouped = logs.reduce<Record<string, DailyLog[]>>((acc, log) => {
    acc[log.date] = acc[log.date] || [];
    acc[log.date].push(log);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (sortedDates.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Sin registros en los últimos 7 días
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sortedDates.map((date) => (
        <DaySummary key={date} date={date} logs={grouped[date]} />
      ))}
    </div>
  );
}
