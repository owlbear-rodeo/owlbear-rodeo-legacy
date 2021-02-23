import React, { useState, useEffect, useContext } from "react";

import { getSettings } from "../settings";

const SettingsContext = React.createContext({
  settings: {},
  setSettings: () => {},
});

const settingsProvider = getSettings();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(settingsProvider.getAll());

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
