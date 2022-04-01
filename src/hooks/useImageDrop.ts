import { useState } from "react";
import { useToasts } from "react-toast-notifications";

import Vector2 from "../helpers/Vector2";

export type ImageDropEvent = {
  files: File[];
  dropPosition: Vector2;
};

function useImageDrop(
  onImageDrop: (event: ImageDropEvent) => void,
  supportFileTypes = ["image/jpeg", "image/gif", "image/png", "image/webp"]
) {
  const { addToast } = useToasts();

  const [dragging, setDragging] = useState(false);
  function onDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  }

  function onDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  }

  async function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    let imageFiles = [];

    // Check if the dropped image is from a URL
    const html = event.dataTransfer?.getData("text/html");
    if (html) {
      try {
        const urlMatch = html.match(/src="?([^"\s]+)"?\s*/);
        if (!urlMatch) {
          throw new Error("Unable to find image source");
        }
        const url = urlMatch[1].replace("&amp;", "&"); // Reverse html encoding of url parameters
        let name = "";
        const altMatch = html.match(/alt="?([^"]+)"?\s*/);
        if (altMatch && altMatch.length > 1) {
          name = altMatch[1];
        }
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], name, {
            type: blob.type,
          });
          if (supportFileTypes.includes(file.type)) {
            imageFiles.push(file);
          } else {
            addToast(`Unsupported file type for ${file.name}`);
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          if (e.message === "Failed to fetch") {
            addToast("Unable to import image: failed to fetch");
          } else {
            addToast("Unable to import image");
          }
        }
      }
    }

    const files = event.dataTransfer?.files || [];
    for (let file of files) {
      if (supportFileTypes.includes(file.type)) {
        imageFiles.push(file);
      } else {
        addToast(`Unsupported file type for ${file.name}`);
      }
    }
    const dropPosition = new Vector2(event.clientX, event.clientY);
    onImageDrop({ files: imageFiles, dropPosition });
    setDragging(false);
  }

  const containerListeners = { onDragEnter };
  const overlayListeners = { onDragLeave, onDragOver, onDrop };

  return { dragging, containerListeners, overlayListeners };
}

export default useImageDrop;
