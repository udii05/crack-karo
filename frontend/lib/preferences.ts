export type Preferences = {
  defaultType: "behavioral" | "technical";
  defaultDifficulty: "beginner" | "intermediate" | "advanced";
  defaultQuestionCount: number;
  defaultDuration: number;
  autoSpeak: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  defaultType: "behavioral",
  defaultDifficulty: "intermediate",
  defaultQuestionCount: 3,
  defaultDuration: 30,
  autoSpeak: true,
};

const KEY = "copilot_preferences";

export function getPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(preferences));
}

export function clearPreferences() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
