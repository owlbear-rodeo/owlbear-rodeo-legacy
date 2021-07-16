import React, { useState, useEffect, useContext } from "react";

import { getSettings } from "../settings";

import { Settings } from "../types/Settings";

type SettingsContext = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
};

const SettingsContext =
  React.createContext<SettingsContext | undefined>(undefined);

const settingsProvider = getSettings();

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(settingsProvider.getAll());

  useEffect(() => {
    settingsProvider.setAll(settings);
  }, [settings]);

  const value = {
    settings,
    setSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export default SettingsContext;
