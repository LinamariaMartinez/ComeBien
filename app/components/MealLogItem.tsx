'use client';

import { useState } from 'react';
import { DailyLog } from '@/lib/types';
import { FOOD_GROUPS } from '@/lib/constants';

interface MealLogItemProps {
  log: DailyLog;
  onDelete: (id: string) => Promise<void>;
}

const MEAL_LABELS: Record<string, string> = {
  desayuno: '🌅 Desayuno',
  almuerzo: '☀️ Almuerzo',
  colación: '🍎 Colación',
  cena: '🌙 Cena',
};

export default function MealLogItem({ log, onDelete }: MealLogItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const time = new Date(log.created_at).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const portionBadges = FOOD_GROUPS.filter(
    (g) => (log.parsed_portions[g.key] || 0) > 0
  ).map((g) => ({
    emoji: g.emoji,
    value: +(log.parsed_portions[g.key]).toFixed(1),
    unit: g.unit,
  }));

  async function handleDelete() {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setDeleting(true);
    await onDelete(log.id);
    setDeleting(false);
    setConfirm(false);
  }

  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-700">
              {MEAL_LABELS[log.meal_time]}
            </span>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
            {log.description}
          </p>
          {portionBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {portionBadges.map((b) => (
                <span
                  key={b.emoji}
                  className="inline-flex items-center gap-0.5 text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5"
                >
                  {b.emoji} {b.value}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`text-xs shrink-0 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
            confirm
              ? 'bg-red-500 text-white'
              : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
          }`}
        >
          {deleting ? '…' : confirm ? '¿Borrar?' : '🗑️'}
        </button>
      </div>
    </div>
  );
}
