import Settings from "./helpers/Settings";

function loadVersions(settings) {
  settings.version(1, () => ({
    fog: {
      type: "polygon",
      useEdgeSnapping: false,
      useFogCut: false,
      preview: false,
    },
    drawing: {
      color: "red",
      type: "brush",
      useBlending: true,
    },
    measure: {
      type: "chebyshev",
      scale: "5ft",
    },
    timer: {
      hour: 0,
      minute: 0,
      second: 0,
    },
    dice: {
      shareDice: false,
      style: "galaxy",
    },
  }));
  // v1.5.2 - Added full screen support for map and label size
  settings.version(2, (prev) => ({
    ...prev,
    map: { fullScreen: false, labelSize: 1 },
  }));
  // v1.7.0 - Added game password
  settings.version(3, (prev) => ({
    ...prev,
    game: { usePassword: true },
  }));
  // v1.8.0 - Added pointer color, grid snapping sensitivity and remove measure
  settings.version(4, (prev) => {
    let newSettings = {
      ...prev,
      pointer: { color: "red" },
      map: { ...prev.map, gridSnappingSensitivity: 0.2 },
    };
    delete newSettings.measure;
    return newSettings;
  });
  // v1.8.0 - Removed edge snapping for multilayer
  settings.version(5, (prev) => {
    let newSettings = { ...prev };
    delete newSettings.fog.useEdgeSnapping;
    newSettings.fog.multilayer = false;
    return newSettings;
  });
  // v1.8.1 - Add show guides toggle
  settings.version(6, (prev) => ({
    ...prev,
    fog: { ...prev.fog, showGuides: true },
  }));
  // v1.8.1 - Add fog edit opacity
  settings.version(7, (prev) => ({
    ...prev,
    fog: { ...prev.fog, editOpacity: 0.5 },
  }));
}

export function getSettings() {
  let settings = new Settings("OwlbearRodeoSettings");
  loadVersions(settings);
  return settings;
}
