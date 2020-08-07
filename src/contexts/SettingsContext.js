import React, { useState, useEffect } from "react";

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

export default SettingsContext;
