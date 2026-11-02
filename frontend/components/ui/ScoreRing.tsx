export default function ScoreRing({
  value,
  size = 132,
  label = "Score",
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#3978e8 0 ${clamped}%, #dce7f7 ${clamped}% 100%)`,
      }}
      role="img"
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <div className="absolute inset-[9px] rounded-full bg-[#f2f6ff]" />
      <div className="relative grid h-full w-full place-items-center text-center">
        <div>
          <strong
            className="block font-bold leading-none tracking-[-1px] text-[#203c68]"
            style={{ fontSize: size >= 120 ? 31 : 20 }}
          >
            {clamped}
          </strong>
          <span
            className="mt-1 block font-bold uppercase tracking-[0.7px] text-[#7a8ba5]"
            style={{ fontSize: size >= 120 ? 10 : 8 }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
