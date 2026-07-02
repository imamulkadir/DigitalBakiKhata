import type { Language } from './translations';

// Mirrors the setSupabaseToken/currentToken pattern in src/lib/supabase.ts —
// lets plain (non-hook) utility functions like currencyFormat/dateRelative
// read the active language without becoming hooks themselves.
let currentLanguage: Language = 'bn';

export function setCurrentLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}
