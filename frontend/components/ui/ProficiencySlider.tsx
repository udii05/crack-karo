"use client";

import { useRef, useState } from "react";

export const PROFICIENCY_LEVELS = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Intermediate" },
  { value: 3, label: "Skilled" },
  { value: 4, label: "Advanced" },
] as const;

export function proficiencyLabel(value: number): string {
  return (
    PROFICIENCY_LEVELS.find((level) => level.value === value)?.label ||
    "Beginner"
  );
}

function clamp(value: number): number {
  return Math.max(1, Math.min(4, value));
}

export default function ProficiencySlider({
  value,
  onChange,
  disabled = false,
  label = "Skill proficiency",
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const current = clamp(value);
  const display = dragging && dragValue !== null ? clamp(dragValue) : current;
  const percent = ((display - 1) / 3) * 100;
  const activeNearest = Math.round(display);

  function valueAt(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return current;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return 1 + ratio * 3;
  }

  function commit(next: number) {
    onChange(clamp(Math.round(next)));
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    event.preventDefault();
    trackRef.current?.setPointerCapture(event.pointerId);
    trackRef.current?.focus();
    setDragging(true);
    setDragValue(valueAt(event.clientX));
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !dragging) return;
    setDragValue(valueAt(event.clientX));
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !dragging) return;
    const raw = dragValue ?? valueAt(event.clientX);
    setDragging(false);
    setDragValue(null);
    commit(raw);
  }

  function onPointerCancel() {
    setDragging(false);
    setDragValue(null);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    let next = current;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      next = Math.min(4, current + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      next = Math.max(1, current - 1);
    } else if (event.key === "Home") {
      next = 1;
    } else if (event.key === "End") {
      next = 4;
    } else {
      return;
    }
    event.preventDefault();
    onChange(next);
  }

  return (
    <div className="select-none">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={current}
        aria-valuetext={proficiencyLabel(current)}
        aria-disabled={disabled}
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
        className={`relative mx-2 h-10 touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        <div className="absolute left-0 right-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[#e7edf5]">
          <div
            className={`h-full rounded-full bg-brand-600 ${
              dragging ? "" : "transition-[width] duration-200 ease-out"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {PROFICIENCY_LEVELS.map((level, index) => {
          const point = (index / 3) * 100;
          const reached = display >= level.value - 0.05;
          return (
            <span
              key={level.value}
              aria-hidden="true"
              className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                reached
                  ? "border-brand-600 bg-brand-600"
                  : "border-[#c7d4e5] bg-white"
              }`}
              style={{ left: `${point}%` }}
            />
          );
        })}

        <span
          aria-hidden="true"
          className={`absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600 bg-white shadow-[0_2px_6px_rgba(25,48,82,0.18)] ${
            dragging
              ? "cursor-grabbing"
              : "cursor-grab transition-[left] duration-200 ease-out"
          }`}
          style={{ left: `${percent}%` }}
        />
      </div>

      <div className="relative mx-2 h-4">
        {PROFICIENCY_LEVELS.map((level, index) => {
          const point = (index / 3) * 100;
          const active = activeNearest === level.value;
          return (
            <span
              key={level.value}
              className={`absolute top-0 whitespace-nowrap text-[10px] ${
                index === 0
                  ? ""
                  : index === PROFICIENCY_LEVELS.length - 1
                    ? "-translate-x-full"
                    : "-translate-x-1/2"
              } ${active ? "font-semibold text-brand-700" : "text-slate-400"}`}
              style={{ left: `${point}%` }}
            >
              {level.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
