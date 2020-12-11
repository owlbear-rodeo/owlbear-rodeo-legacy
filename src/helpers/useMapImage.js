import { useEffect, useState } from "react";
import useImage from "use-image";

import useDataSource from "./useDataSource";

import { mapSources as defaultMapSources } from "../maps";

function useMapImage(map) {
  const mapSource = useDataSource(map, defaultMapSources);
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
