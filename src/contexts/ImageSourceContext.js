import React, { useContext, useState, useEffect } from "react";

import { omit } from "../helpers/shared";

export const ImageSourcesStateContext = React.createContext();
export const ImageSourcesUpdaterContext = React.createContext(() => {});

/**
 * Helper to manage sharing of custom image sources between uses of useImageSource
 */
export function ImageSourcesProvider({ children }) {
  const [imageSources, setImageSources] = useState({});

  // Revoke url when no more references
  useEffect(() => {
    let sourcesToCleanup = [];
    for (let source of Object.values(imageSources)) {
      if (source.references <= 0) {
        URL.revokeObjectURL(source.url);
        sourcesToCleanup.push(source.id);
      }
    }
    if (sourcesToCleanup.length > 0) {
      setImageSources((prevSources) => omit(prevSources, sourcesToCleanup));
    }
  }, [imageSources]);

  return (
    <ImageSourcesStateContext.Provider value={imageSources}>
      <ImageSourcesUpdaterContext.Provider value={setImageSources}>
        {children}
      </ImageSourcesUpdaterContext.Provider>
    </ImageSourcesStateContext.Provider>
  );
}

/**
 * Get id from image data
 */
function getImageFileId(data, thumbnail) {
  if (thumbnail) {
    return `${data.id}-thumbnail`;
  }
  if (data.resolutions) {
    // Check is a resolution is specified
    if (data.quality && data.resolutions[data.quality]) {
      return `${data.id}-${data.quality}`;
    } else if (!data.file) {
      // Fallback to the highest resolution
      const resolutionArray = Object.keys(data.resolutions);
      const resolution = resolutionArray[resolutionArray.length - 1];
      return `${data.id}-${resolution.id}`;
    }
  }
  return data.id;
}

/**
 * Helper function to load either file or default image into a URL
 */
export function useImageSource(data, defaultSources, unknownSource, thumbnail) {
  const imageSources = useContext(ImageSourcesStateContext);
  if (imageSources === undefined) {
    throw new Error(
      "useImageSource must be used within a ImageSourcesProvider"
    );
  }
  const setImageSources = useContext(ImageSourcesUpdaterContext);
  if (setImageSources === undefined) {
    throw new Error(
      "useImageSource must be used within a ImageSourcesProvider"
    );
  }

  useEffect(() => {
    if (!data || data.type !== "file") {
      return;
    }
    const id = getImageFileId(data, thumbnail);

    function updateImageSource(file) {
      if (file) {
        setImageSources((prevSources) => {
          if (id in prevSources) {
            // Check if the image source is already added
            return {
              ...prevSources,
              [id]: {
                ...prevSources[id],
                // Increase references
                references: prevSources[id].references + 1,
              },
            };
          } else {
            const url = URL.createObjectURL(new Blob([file]));
            return {
              ...prevSources,
              [id]: { url, id, references: 1 },
            };
          }
        });
      }
    }

    if (thumbnail) {
      updateImageSource(data.thumbnail.file);
    } else if (data.resolutions) {
      // Check is a resolution is specified
      if (data.quality && data.resolutions[data.quality]) {
        updateImageSource(data.resolutions[data.quality].file);
      }
      // If no file available fallback to the highest resolution
      else if (!data.file) {
        const resolutionArray = Object.keys(data.resolutions);
        updateImageSource(
          data.resolutions[resolutionArray[resolutionArray.length - 1]].file
        );
      } else {
        updateImageSource(data.file);
      }
    } else {
      updateImageSource(data.file);
    }

    return () => {
      // Decrease references
      setImageSources((prevSources) => {
        if (id in prevSources) {
          return {
            ...prevSources,
            [id]: {
              ...prevSources[id],
              references: prevSources[id].references - 1,
            },
          };
        } else {
          return prevSources;
        }
      });
    };
  }, [data, unknownSource, thumbnail, setImageSources]);

  if (!data) {
    return unknownSource;
  }

  if (data.type === "default") {
    return defaultSources[data.key];
  }

  if (data.type === "file") {
    const id = getImageFileId(data, thumbnail);
    return imageSources[id]?.url;
  }

  return unknownSource;
}
