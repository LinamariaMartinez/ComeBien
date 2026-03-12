'use client';

interface ProgressCardProps {
  emoji: string;
  label: string;
  current: number;
  target: number;
  unit: string;
}

export default function ProgressCard({ emoji, label, current, target, unit }: ProgressCardProps) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const done = current >= target;
  const over = current > target;

  const barColor = done
    ? 'bg-green-500'
    : pct >= 50
    ? 'bg-green-400'
    : 'bg-green-300';

  const displayVal = Number.isInteger(current) ? current : +current.toFixed(1);

  return (
    <div
      className={`rounded-2xl p-3 flex flex-col gap-2 border transition-all ${
        done
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">{emoji}</span>
          <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
        </div>
        {done && <span className="text-green-500 text-sm">✓</span>}
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor} ${over ? 'opacity-80' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 text-right">
        <span className={`font-semibold ${done ? 'text-green-600' : 'text-gray-800'}`}>
          {displayVal}
        </span>
        {' / '}{target} {unit}
      </p>
    </div>
  );
}
