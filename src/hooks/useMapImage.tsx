import { useEffect, useState } from "react";
import useImage from "use-image";

import { useDataURL } from "../contexts/AssetsContext";

import { mapSources as defaultMapSources } from "../maps";

function useMapImage(map) {
  const mapURL = useDataURL(map, defaultMapSources);
  const [mapImage, mapImageStatus] = useImage(mapURL);

  // Create a map source that only updates when the image is fully loaded
  const [loadedMapImage, setLoadedMapImage] = useState();
  useEffect(() => {
    if (mapImageStatus === "loaded") {
      setLoadedMapImage(mapImage);
    }
  }, [mapImage, mapImageStatus]);

  return [loadedMapImage, mapImageStatus];
}

export default useMapImage;
