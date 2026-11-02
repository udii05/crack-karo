export default function ProgressBar({
  value,
  tone = "brand",
  className = "",
}: {
  value: number;
  tone?: "brand" | "emerald" | "amber" | "red" | "lavender";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const tones: Record<string, string> = {
    brand: "bg-[#6c9aee]",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    lavender: "bg-[#6c9aee]",
  };
  return (
    <div className={`h-[7px] w-full overflow-hidden rounded-full bg-[#eff3f8] ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${tones[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
