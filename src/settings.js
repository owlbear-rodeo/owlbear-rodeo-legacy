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
  // v1.7.1 - Added pointer color
  settings.version(4, (prev) => ({
    ...prev,
    pointer: { color: "red" },
  }));
}

export function getSettings() {
  let settings = new Settings("OwlbearRodeoSettings");
  loadVersions(settings);
  return settings;
}
