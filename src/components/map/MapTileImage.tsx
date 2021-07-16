import { Image, ImageProps } from "theme-ui";

import { useDataURL } from "../../contexts/AssetsContext";
import { mapSources as defaultMapSources } from "../../maps";
import { Map } from "../../types/Map";

type MapTileImageProps = {
  map: Map;
} & ImageProps;

function MapTileImage({ map, ...props }: MapTileImageProps) {
    const mapURL = useDataURL(
      map,
      defaultMapSources,
      undefined,
      map.type === "file"
    );

    return <Image src={mapURL} {...props} />;
  }
);

export default MapTileImage;
