import React from "react";
import { Image } from "theme-ui";

import { useDataURL } from "../../contexts/AssetsContext";
import { mapSources as defaultMapSources } from "../../maps";

const MapTileImage = React.forwardRef(({ map, ...props }) => {
  const mapURL = useDataURL(
    map,
    defaultMapSources,
    undefined,
    map.type === "file"
  );

  return <Image src={mapURL} {...props} />;
});

export default MapTileImage;
