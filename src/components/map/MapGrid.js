import React, { useEffect, useState } from "react";
import useImage from "use-image";

import useDataSource from "../../hooks/useDataSource";
import { mapSources as defaultMapSources } from "../../maps";

import { getImageLightness } from "../../helpers/image";

import Grid from "../Grid";

function MapGrid({ map }) {
  let mapSourceMap = map;
  // Use lowest resolution for grid lightness
  if (map && map.type === "file" && map.resolutions) {
    const resolutionArray = Object.keys(map.resolutions);
    if (resolutionArray.length > 0) {
      mapSourceMap = map.resolutions[resolutionArray[0]];
    }
  }
  const mapSource = useDataSource(mapSourceMap, defaultMapSources);
  const [mapImage, mapLoadingStatus] = useImage(mapSource);

  const [isImageLight, setIsImageLight] = useState(true);

  // When the map changes find the average lightness of its pixels
  useEffect(() => {
    if (mapLoadingStatus === "loaded") {
      setIsImageLight(getImageLightness(mapImage));
    }
  }, [mapImage, mapLoadingStatus]);

  return <Grid stroke={isImageLight ? "black" : "white"} />;
}

export default MapGrid;
