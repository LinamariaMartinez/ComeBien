'use client';

import { useState } from 'react';
import { MealTime } from '@/lib/types';
import { MEAL_TIMES } from '@/lib/constants';

interface MealLoggerProps {
  onLog: (description: string, mealTime: MealTime) => Promise<void>;
}

export default function MealLogger({ onLog }: MealLoggerProps) {
  const [description, setDescription] = useState('');
  const [mealTime, setMealTime] = useState<MealTime>('desayuno');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || loading) return;
    setError('');
    setLoading(true);
    try {
      await onLog(description.trim(), mealTime);
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar comida');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">Registrar comida</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-1.5">
          {MEAL_TIMES.map((mt) => (
            <button
              key={mt.value}
              type="button"
              onClick={() => setMealTime(mt.value as MealTime)}
              className={`text-xs py-2 rounded-xl font-medium transition-all ${
                mealTime === mt.value
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mt.label}
            </button>
          ))}
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Almorcé ½ taza de arroz, ½ taza de lentejas, ensalada de lechuga y tomate, y un banano"
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-green-300 placeholder-gray-400"
        />

        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={!description.trim() || loading}
          className="w-full bg-green-500 text-white text-sm font-semibold rounded-xl py-3 disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin text-base">⏳</span>
              Analizando con IA…
            </>
          ) : (
            <>
              <span>🍽️</span>
              Registrar comida
            </>
          )}
        </button>
      </form>
    </div>
  );
}
