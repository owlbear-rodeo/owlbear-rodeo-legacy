import React, { useContext, useEffect, useState } from "react";
import useImage from "use-image";

import MapInteractionContext from "../../contexts/MapInteractionContext";

import useDataSource from "../../helpers/useDataSource";
import { mapSources as defaultMapSources } from "../../maps";

import { getImageLightness } from "../../helpers/image";

import Grid from "../Grid";

function MapGrid({ map, strokeWidth }) {
  const { mapWidth, mapHeight } = useContext(MapInteractionContext);

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

  const gridX = map && map.grid.size.x;
  const gridY = map && map.grid.size.y;

  const gridInset = map && map.grid.inset;

  return (
    <Grid
      gridX={gridX}
      gridY={gridY}
      gridInset={gridInset}
      strokeWidth={strokeWidth}
      width={mapWidth}
      height={mapHeight}
      stroke={isImageLight ? "black" : "white"}
    />
  );
}

MapGrid.defaultProps = {
  strokeWidth: 0.1,
};

export default MapGrid;
