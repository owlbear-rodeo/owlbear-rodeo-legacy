import React from "react";
import { Image } from "theme-ui";

import { useDataURL } from "../../contexts/AssetsContext";
import { mapSources as defaultMapSources } from "../../maps";

function MapTileImage({ map, sx }) {
  const mapURL = useDataURL(
    map,
    defaultMapSources,
    undefined,
    map.type === "file"
  );

  return <Image sx={sx} src={mapURL}></Image>;
}

export default MapTileImage;
