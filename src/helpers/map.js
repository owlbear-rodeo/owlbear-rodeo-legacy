/**
 * Get the asset id of the preview file to send for a map
 * @param {any} map
 * @returns {undefined|string}
 */
export function getMapPreviewAsset(map) {
  const res = map.resolutions;
  switch (map.quality) {
    case "low":
      return;
    case "medium":
      return res.low;
    case "high":
      return res.medium;
    case "ultra":
      return res.medium;
    case "original":
      if (res.medium) {
        return res.medium;
      } else if (res.low) {
        return res.low;
      }
      return;
    default:
      return;
  }
}
