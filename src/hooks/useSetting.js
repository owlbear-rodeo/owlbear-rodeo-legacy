import get from "lodash.get";
import set from "lodash.set";

import { useSettings } from "../contexts/SettingsContext";

/**
 * Helper to get and set nested settings that are saved in local storage
 * @param {String} path The path to the setting within the Settings object provided by the SettingsContext
 */
function useSetting(path) {
  const { settings, setSettings } = useSettings();

  const setting = get(settings, path);

  const setSetting = (value) =>
    setSettings((prev) => {
      const updated = set({ ...prev }, path, value);
      return updated;
    });

  return [setting, setSetting];
}

export default useSetting;
