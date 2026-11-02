export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatPracticeTime(minutes: number): string {
  if (!minutes || minutes <= 0) return "0h 0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h ${rest}m`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "IC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function scoreTone(score: number | null | undefined): string {
  if (score === null || score === undefined) return "bg-slate-100 text-slate-600";
  if (score >= 75) return "bg-emerald-50 text-emerald-700";
  if (score >= 50) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

export function statusTone(status: string): string {
  if (status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function statusLabel(status: string): string {
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  return status.replace(/_/g, " ");
}

export function goalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planning: "Planning",
    preparing: "Preparing",
    ready: "Ready",
    completed: "Completed",
  };
  return labels[status] || status;
}

export function goalStatusTone(status: string): string {
  const tones: Record<string, string> = {
    planning: "bg-slate-100 text-slate-600",
    preparing: "bg-amber-50 text-amber-700",
    ready: "bg-brand-50 text-brand-700",
    completed: "bg-emerald-50 text-emerald-700",
  };
  return tones[status] || "bg-slate-100 text-slate-600";
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
