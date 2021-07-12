import get from "lodash.get";
import set from "lodash.set";

import { useSettings } from "../contexts/SettingsContext";

/**
 * Helper to get and set nested settings that are saved in local storage
 * @param {string} path The path to the setting within the Settings object provided by the SettingsContext
 */
function useSetting<Type>(path: string): [Type, (value: Type) => void] {
  const { settings, setSettings } = useSettings();

  const setting = get(settings, path) as Type;

  const setSetting = (value: Type) =>
    setSettings((prev) => {
      const updated = set({ ...prev }, path, value);
      return updated;
    });

  return [setting, setSetting];
}

export default useSetting;
