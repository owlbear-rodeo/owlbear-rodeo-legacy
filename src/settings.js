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
  settings.version(2, (prev) => ({ ...prev, map: { fullScreen: false } }));
}

export function getSettings() {
  let settings = new Settings("OwlbearRodeoSettings");
  loadVersions(settings);
  return settings;
}
