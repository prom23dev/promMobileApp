import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { activatePrivacy, createPrivacyChoice, optionalOff, parsePrivacy, privacyKey, type PrivacyCategories, type PrivacyChoice } from './privacy-model';
const Context = createContext<{ ready: boolean; choice: PrivacyChoice | null; settingsOpen: boolean; setSettingsOpen: (v: boolean) => void; save: (v: PrivacyCategories) => Promise<void> } | null>(null);
export function PrivacyPreferencesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false), [choice, setChoice] = useState<PrivacyChoice | null>(null), [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => { let mounted = true; void (async () => { let restored = null; try { restored = parsePrivacy(Platform.OS === 'web' ? localStorage.getItem(privacyKey) : await SecureStore.getItemAsync(privacyKey)); } catch {} if (mounted) { activatePrivacy(restored ?? optionalOff); setChoice(restored); setReady(true); } })(); return () => { mounted = false; }; }, []);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const restore = (event: StorageEvent) => { if (event.key !== privacyKey && event.key !== null) return; const next = parsePrivacy(event.newValue); activatePrivacy(next ?? optionalOff); setChoice(next); };
    window.addEventListener('storage', restore); return () => window.removeEventListener('storage', restore);
  }, []);
  async function save(value: PrivacyCategories) { const next = createPrivacyChoice(value); activatePrivacy(next); setChoice(next); try { if (Platform.OS === 'web') localStorage.setItem(privacyKey, JSON.stringify(next)); else await SecureStore.setItemAsync(privacyKey, JSON.stringify(next)); } catch { throw new Error('Выбор применён к текущему сеансу, но не сохранился на устройстве. При следующем посещении мы спросим снова.'); } }
  useEffect(() => { if (!choice) return; const timer = setInterval(() => { if (Date.parse(choice.expiresAt) <= Date.now()) { activatePrivacy(optionalOff); setChoice(null); } }, 60000); return () => clearInterval(timer); }, [choice]);
  return <Context.Provider value={{ ready, choice, settingsOpen, setSettingsOpen, save }}>{children}</Context.Provider>;
}
export function usePrivacy() { const value = useContext(Context); if (!value) throw new Error('PrivacyPreferencesProvider missing'); return value; }
