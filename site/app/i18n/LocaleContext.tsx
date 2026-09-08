"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { DICTIONARY, type DictKey } from "./dictionary";

export type Locale = "en" | "ms" | "zh";

const STORAGE_KEY = "klx-locale";

const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Locale {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "ms" || saved === "zh") return saved;
  return "en";
}

function getServerSnapshot(): Locale {
  return "en";
}

function writeLocale(next: Locale) {
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((l) => l());
}

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (key: DictKey) => string };

const LocaleCtx = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      setLocale: writeLocale,
      t: (key) => DICTIONARY[locale][key] ?? DICTIONARY.en[key] ?? key,
    }),
    [locale],
  );

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleCtx);
  if (!ctx) {
    return { locale: "en", setLocale: () => {}, t: (key) => DICTIONARY.en[key] ?? key };
  }
  return ctx;
}
