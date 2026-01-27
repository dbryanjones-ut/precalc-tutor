import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, AccessibilityPreset } from "@/types";
import { defaultSettings, accessibilityPresets } from "@/types";

interface SettingsStore {
  settings: AppSettings;

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  toggleDyslexiaMode: () => void;
  toggleADHDScaffold: (key: keyof AppSettings["adhd"]) => void;
  setTutoringMode: (mode: "socratic" | "explanation") => void;
  applyAccessibilityPreset: (preset: AccessibilityPreset) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      toggleTheme: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme:
              state.settings.theme === "dark"
                ? "light"
                : state.settings.theme === "light"
                ? "system"
                : "dark",
          },
        })),

      toggleDyslexiaMode: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            dyslexiaMode: !state.settings.dyslexiaMode,
            dyslexiaFont: !state.settings.dyslexiaMode
              ? true
              : state.settings.dyslexiaFont,
          },
        })),

      toggleADHDScaffold: (key) =>
        set((state) => ({
          settings: {
            ...state.settings,
            adhd: {
              ...state.settings.adhd,
              [key]: !state.settings.adhd[key],
            },
          },
        })),

      setTutoringMode: (mode) =>
        set((state) => ({
          settings: {
            ...state.settings,
            defaultTutoringMode: mode,
          },
        })),

      applyAccessibilityPreset: (preset) =>
        set((state) => {
          const presetSettings = accessibilityPresets[preset];
          return {
            settings: {
              ...state.settings,
              ...presetSettings,
              // Deep merge ADHD settings if present
              ...(presetSettings.adhd && {
                adhd: {
                  ...state.settings.adhd,
                  ...presetSettings.adhd,
                },
              }),
            },
          };
        }),

      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: "precalc-settings-v1",
    }
  )
);
