'use client';

import { Portions } from '@/lib/types';
import { DAILY_TARGETS, FOOD_GROUPS } from '@/lib/constants';

interface WhatsMissingProps {
  totals: Portions;
  targets?: Portions;
}

export default function WhatsMissing({ totals, targets = DAILY_TARGETS }: WhatsMissingProps) {
  const missing = FOOD_GROUPS.filter(
    (g) => totals[g.key] < targets[g.key]
  ).map((g) => ({
    ...g,
    remaining: +(targets[g.key] - totals[g.key]).toFixed(1),
  }));

  if (missing.length === 0) {
    return (
      <div className="rounded-2xl bg-green-500 text-white p-4 text-center">
        <p className="text-2xl mb-1">🎉</p>
        <p className="font-semibold text-sm">¡Meta diaria cumplida!</p>
        <p className="text-xs opacity-80 mt-0.5">Excelente trabajo hoy</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
      <p className="text-xs font-semibold text-amber-800 mb-2">¿Qué te falta hoy?</p>
      <div className="flex flex-wrap gap-2">
        {missing.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1 text-xs bg-white border border-amber-200 text-amber-900 rounded-full px-2.5 py-1"
          >
            <span>{item.emoji}</span>
            <span className="font-medium">{item.remaining}</span>
            <span className="opacity-70">{item.unit}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
