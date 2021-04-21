import { useEffect, useState } from "react";
import useImage from "use-image";

import { useImageSource } from "../contexts/ImageSourceContext";

import { mapSources as defaultMapSources } from "../maps";

function useMapImage(map) {
  const mapSource = useImageSource(map, defaultMapSources);
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
