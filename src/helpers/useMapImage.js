import { useEffect, useState } from "react";
import useImage from "use-image";

import useDataSource from "./useDataSource";

import { mapSources as defaultMapSources } from "../maps";

function useMapImage(map) {
  const [mapSourceMap, setMapSourceMap] = useState({});
  // Update source map data when either the map or map quality changes
  useEffect(() => {
    function updateMapSource() {
      if (map && map.type === "file" && map.resolutions) {
        // If quality is set and the quality is available
        if (map.quality !== "original" && map.resolutions[map.quality]) {
          setMapSourceMap({
            ...map.resolutions[map.quality],
            id: map.id,
            quality: map.quality,
          });
        } else if (!map.file) {
          // If no file fallback to the highest resolution
          const resolutionArray = Object.keys(map.resolutions);
          setMapSourceMap({
            ...map.resolutions[resolutionArray[resolutionArray.length - 1]],
            id: map.id,
          });
        } else {
          setMapSourceMap(map);
        }
      } else {
        setMapSourceMap(map);
      }
    }
    if (map && map.id !== mapSourceMap.id) {
      updateMapSource();
    } else if (map && map.type === "file") {
      if (map.file && map.quality !== mapSourceMap.quality) {
        updateMapSource();
      }
    }
  }, [map, mapSourceMap]);

  const mapSource = useDataSource(mapSourceMap, defaultMapSources);
  const [mapSourceImage, mapSourceImageStatus] = useImage(mapSource);

  // Create a map source that only updates when the image is fully loaded
  const [loadedMapSourceImage, setLoadedMapSourceImage] = useState();
  useEffect(() => {
    if (mapSourceImageStatus === "loaded") {
      setLoadedMapSourceImage(mapSourceImage);
    }
  }, [mapSourceImage, mapSourceImageStatus]);

  return [loadedMapSourceImage, mapSourceImageStatus];
}

export default useMapImage;
