import React, { useContext, useEffect, useState } from "react";
import { Line, Group } from "react-konva";
import useImage from "use-image";

import MapInteractionContext from "../../contexts/MapInteractionContext";

import useDataSource from "../../helpers/useDataSource";
import { mapSources as defaultMapSources } from "../../maps";

import { getStrokeWidth } from "../../helpers/drawing";
import { getImageLightness } from "../../helpers/image";

function MapGrid({ map, strokeWidth }) {
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

  const gridX = map && map.grid.size.x;
  const gridY = map && map.grid.size.y;
  const gridSizeNormalized = {
    x: gridX ? 1 / gridX : 0,
    y: gridY ? 1 / gridY : 0,
  };

  const { mapWidth, mapHeight } = useContext(MapInteractionContext);

  const lineSpacingX = mapWidth / gridX;
  const lineSpacingY = mapHeight / gridY;

  const [isImageLight, setIsImageLight] = useState(true);

  // When the map changes find the average lightness of its pixels
  useEffect(() => {
    if (mapLoadingStatus === "loaded") {
      console.log("getting lightness");
      setIsImageLight(getImageLightness(mapImage));
    }
  }, [mapImage, mapLoadingStatus]);

  const lines = [];
  for (let x = 1; x < gridX; x++) {
    lines.push(
      <Line
        key={`grid_x_${x}`}
        points={[x * lineSpacingX, 0, x * lineSpacingX, mapHeight]}
        stroke={isImageLight ? "black" : "white"}
        strokeWidth={getStrokeWidth(
          strokeWidth,
          gridSizeNormalized,
          mapWidth,
          mapHeight
        )}
        opacity={0.5}
      />
    );
  }
  for (let y = 1; y < gridY; y++) {
    lines.push(
      <Line
        key={`grid_y_${y}`}
        points={[0, y * lineSpacingY, mapWidth, y * lineSpacingY]}
        stroke={isImageLight ? "black" : "white"}
        strokeWidth={getStrokeWidth(
          strokeWidth,
          gridSizeNormalized,
          mapWidth,
          mapHeight
        )}
        opacity={0.5}
      />
    );
  }

  return <Group>{lines}</Group>;
}

MapGrid.defaultProps = {
  strokeWidth: 0.1,
};

export default MapGrid;
