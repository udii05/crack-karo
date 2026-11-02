export default function ReadinessGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = clamped >= 70 ? "#16a34a" : clamped >= 40 ? "#d97706" : "#dc2626";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-extrabold text-slate-900">{clamped}</div>
        <div className="text-xs text-slate-500">Readiness</div>
      </div>
    </div>
  );
}
