import React, { useContext, useEffect, useState } from "react";
import { Line, Group } from "react-konva";
import useImage from "use-image";

import MapInteractionContext from "../../contexts/MapInteractionContext";

import useDataSource from "../../helpers/useDataSource";
import { mapSources as defaultMapSources } from "../../maps";

import { getStrokeWidth } from "../../helpers/drawing";
import { getImageLightness } from "../../helpers/image";

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

  if (!gridX || !gridY) {
    return null;
  }

  const gridInset = map && map.grid.inset;

  const gridSizeNormalized = {
    x: (gridInset.bottomRight.x - gridInset.topLeft.x) / gridX,
    y: (gridInset.bottomRight.y - gridInset.topLeft.y) / gridY,
  };

  const insetWidth = (gridInset.bottomRight.x - gridInset.topLeft.x) * mapWidth;
  const insetHeight =
    (gridInset.bottomRight.y - gridInset.topLeft.y) * mapHeight;

  const lineSpacingX = insetWidth / gridX;
  const lineSpacingY = insetHeight / gridY;

  const offsetX = gridInset.topLeft.x * mapWidth * -1;
  const offsetY = gridInset.topLeft.y * mapHeight * -1;

  const lines = [];
  for (let x = 1; x < gridX; x++) {
    lines.push(
      <Line
        key={`grid_x_${x}`}
        points={[x * lineSpacingX, 0, x * lineSpacingX, insetHeight]}
        stroke={isImageLight ? "black" : "white"}
        strokeWidth={getStrokeWidth(
          strokeWidth,
          gridSizeNormalized,
          mapWidth,
          mapHeight
        )}
        opacity={0.5}
        offsetX={offsetX}
        offsetY={offsetY}
      />
    );
  }
  for (let y = 1; y < gridY; y++) {
    lines.push(
      <Line
        key={`grid_y_${y}`}
        points={[0, y * lineSpacingY, insetWidth, y * lineSpacingY]}
        stroke={isImageLight ? "black" : "white"}
        strokeWidth={getStrokeWidth(
          strokeWidth,
          gridSizeNormalized,
          mapWidth,
          mapHeight
        )}
        opacity={0.5}
        offsetX={offsetX}
        offsetY={offsetY}
      />
    );
  }

  return <Group>{lines}</Group>;
}

MapGrid.defaultProps = {
  strokeWidth: 0.1,
};

export default MapGrid;
