/**
 * An interface to a local storage back settings store with a versioning mechanism
 */
class Settings {
  name;
  currentVersion;

  constructor(name) {
    this.name = name;
    this.currentVersion = this.get("__version");
  }

  version(versionNumber, upgradeFunction) {
    if (versionNumber > this.currentVersion) {
      this.currentVersion = versionNumber;
      this.setAll(upgradeFunction(this.getAll()));
    }
  }

  getAll() {
    return JSON.parse(localStorage.getItem(this.name));
  }

  get(key) {
    const settings = this.getAll();
    return settings && settings[key];
  }

  setAll(newSettings) {
    localStorage.setItem(
      this.name,
      JSON.stringify({ ...newSettings, __version: this.currentVersion })
    );
  }

  set(key, value) {
    let settings = this.getAll();
    settings[key] = value;
    this.setAll(settings);
  }
}

export default Settings;
