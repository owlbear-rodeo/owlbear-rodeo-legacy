import React, { useContext, useEffect, useState } from "react";
import { Line, Group } from "react-konva";
import useImage from "use-image";

import MapInteractionContext from "../../contexts/MapInteractionContext";

import useDataSource from "../../helpers/useDataSource";
import { mapSources as defaultMapSources } from "../../maps";

import { getStrokeWidth } from "../../helpers/drawing";

const lightnessDetectionOffset = 0.1;

function MapGrid({ map, gridSize }) {
  const mapSource = useDataSource(map, defaultMapSources);
  const [mapImage, mapLoadingStatus] = useImage(mapSource);

  const gridX = map && map.gridX;
  const gridY = map && map.gridY;

  const { mapWidth, mapHeight } = useContext(MapInteractionContext);

  const lineSpacingX = mapWidth / gridX;
  const lineSpacingY = mapHeight / gridY;

  const [isImageLight, setIsImageLight] = useState(true);

  // When the map changes find the average lightness of its pixels
  useEffect(() => {
    if (mapLoadingStatus === "loaded") {
      const imageWidth = mapImage.width;
      const imageHeight = mapImage.height;
      let canvas = document.createElement("canvas");
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      let context = canvas.getContext("2d");
      context.drawImage(mapImage, 0, 0);
      const imageData = context.getImageData(0, 0, imageWidth, imageHeight);

      const data = imageData.data;
      let lightPixels = 0;
      let darkPixels = 0;
      // Loop over every pixels rgba values
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(Math.max(r, g), b);
        if (max < 128) {
          darkPixels++;
        } else {
          lightPixels++;
        }
      }

      const norm = (lightPixels - darkPixels) / (imageWidth * imageHeight);
      if (norm + lightnessDetectionOffset < 0) {
        setIsImageLight(false);
      } else {
        setIsImageLight(true);
      }
    }
  }, [mapImage, mapLoadingStatus]);

  const lines = [];
  for (let x = 1; x < gridX; x++) {
    lines.push(
      <Line
        key={`grid_x_${x}`}
        points={[x * lineSpacingX, 0, x * lineSpacingX, mapHeight]}
        stroke={isImageLight ? "black" : "white"}
        strokeWidth={getStrokeWidth(0.1, gridSize, mapWidth, mapHeight)}
        opacity={0.8}
      />
    );
  }
  for (let y = 1; y < gridY; y++) {
    lines.push(
      <Line
        key={`grid_y_${y}`}
        points={[0, y * lineSpacingY, mapWidth, y * lineSpacingY]}
        stroke={isImageLight ? "black" : "white"}
        strokeWidth={getStrokeWidth(0.1, gridSize, mapWidth, mapHeight)}
        opacity={0.8}
      />
    );
  }

  return <Group>{lines}</Group>;
}

export default MapGrid;
