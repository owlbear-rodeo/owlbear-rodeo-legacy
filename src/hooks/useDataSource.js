import { useEffect, useState } from "react";

// Helper function to load either file or default data
// into a URL and ensure that it is revoked if needed
function useDataSource(data, defaultSources, unknownSource) {
  const [dataSource, setDataSource] = useState(null);
  useEffect(() => {
    if (!data) {
      setDataSource(unknownSource);
      return;
    }
    let url = unknownSource;
    if (data.type === "file") {
      if (data.resolutions) {
        // Check is a resolution is specified
        if (data.quality && data.resolutions[data.quality]) {
          url = URL.createObjectURL(
            new Blob([data.resolutions[data.quality].file])
          );
        }
        // If no file available fallback to the highest resolution
        else if (!data.file) {
          const resolutionArray = Object.keys(data.resolutions);
          url = URL.createObjectURL(
            new Blob([
              data.resolutions[resolutionArray[resolutionArray.length - 1]]
                .file,
            ])
          );
        } else {
          url = URL.createObjectURL(new Blob([data.file]));
        }
      } else {
        url = URL.createObjectURL(new Blob([data.file]));
      }
    } else if (data.type === "default") {
      url = defaultSources[data.key];
    }
    setDataSource(url);

    return () => {
      if (data.type === "file" && url) {
        // Remove file url after 5 seconds as we still may be using it while the next image loads
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 5000);
      }
    };
  }, [data, defaultSources, unknownSource]);

  return dataSource;
}

export default useDataSource;
