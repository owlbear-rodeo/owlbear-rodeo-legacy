import { v4 as uuid } from "uuid";
import Case from "case";

import blobToBuffer from "./blobToBuffer";
import { resizeImage, createThumbnail } from "./image";
import {
  getGridDefaultInset,
  getGridSizeFromImage,
  gridSizeVaild,
} from "./grid";
import Vector2 from "./Vector2";

import { Map, FileMapResolutions, FileMap } from "../types/Map";
import { Asset } from "../types/Asset";

type Resolution = {
  size: number;
  quality: number;
  id: "low" | "medium" | "high" | "ultra";
};

const mapResolutions: Resolution[] = [
  {
    size: 30, // Pixels per grid
    quality: 0.5, // JPEG compression quality
    id: "low",
  },
  { size: 70, quality: 0.6, id: "medium" },
  { size: 140, quality: 0.7, id: "high" },
  { size: 300, quality: 0.8, id: "ultra" },
];

/**
 * Get the asset id of the preview file to send for a map
 */
export function getMapPreviewAsset(map: Map): string | undefined {
  if (map.type === "file") {
    const res = map.resolutions;
    switch (map.quality) {
      case "low":
        return;
      case "medium":
        return res.low;
      case "high":
        return res.medium;
      case "ultra":
        return res.medium;
      case "original":
        if (res.medium) {
          return res.medium;
        } else if (res.low) {
          return res.low;
        }
        return;
      default:
        return;
    }
  }
}

export async function createMapFromFile(
  file: File,
  userId: string
): Promise<{ map: Map; assets: Asset[] }> {
  let image = new Image();

  const buffer = await blobToBuffer(file);
  // Copy file to avoid permissions issues
  const blob = new Blob([buffer]);
  // Create and load the image temporarily to get its dimensions
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    image.onload = async function () {
      // Find name and grid size
      let gridSize;
      let name = "Unknown Map";
      if (file.name) {
        if (file.name.matchAll) {
          // Match against a regex to find the grid size in the file name
          // e.g. Cave 22x23 will return [["22x22", "22", "x", "23"]]
          const gridMatches = [...file.name.matchAll(/(\d+) ?(x|X) ?(\d+)/g)];
          for (let match of gridMatches) {
            const matchX = parseInt(match[1]);
            const matchY = parseInt(match[3]);
            if (
              !isNaN(matchX) &&
              !isNaN(matchY) &&
              gridSizeVaild(matchX, matchY)
            ) {
              gridSize = { x: matchX, y: matchY };
            }
          }
        }

        if (!gridSize) {
          gridSize = await getGridSizeFromImage(image);
        }

        // Remove file extension
        name = file.name.replace(/\.[^/.]+$/, "");
        // Removed grid size expression
        name = name.replace(/(\[ ?|\( ?)?\d+ ?(x|X) ?\d+( ?\]| ?\))?/, "");
        // Clean string
        name = name.replace(/ +/g, " ");
        name = name.trim();
        // Capitalize and remove underscores
        name = Case.capital(name);
      }

      if (!gridSize) {
        gridSize = { x: 22, y: 22 };
      }

      let assets: Asset[] = [];

      // Create resolutions
      const resolutions: FileMapResolutions = {};
      for (let resolution of mapResolutions) {
        const resolutionPixelSize = Vector2.multiply(gridSize, resolution.size);
        if (
          image.width >= resolutionPixelSize.x &&
          image.height >= resolutionPixelSize.y
        ) {
          const resized = await resizeImage(
            image,
            Vector2.componentMax(resolutionPixelSize),
            file.type,
            resolution.quality
          );
          if (resized) {
            const assetId = uuid();
            resolutions[resolution.id] = assetId;
            const asset = {
              ...resized,
              id: assetId,
              owner: userId,
            };
            assets.push(asset);
          }
        }
      }
      // Create thumbnail
      const thumbnailImage = await createThumbnail(image, file.type);
      const thumbnailId = uuid();
      if (thumbnailImage) {
        const thumbnail = { ...thumbnailImage, id: thumbnailId, owner: userId };
        assets.push(thumbnail);
      }

      const fileAsset = {
        id: uuid(),
        file: buffer,
        width: image.width,
        height: image.height,
        mime: file.type,
        owner: userId,
      };
      assets.push(fileAsset);

      const map: FileMap = {
        name,
        resolutions,
        file: fileAsset.id,
        thumbnail: thumbnailId,
        type: "file",
        grid: {
          size: gridSize,
          inset: getGridDefaultInset(
            { size: gridSize, type: "square" },
            image.width,
            image.height
          ),
          type: "square",
          measurement: {
            type: "chebyshev",
            scale: "5ft",
          },
        },
        width: image.width,
        height: image.height,
        id: uuid(),
        created: Date.now(),
        lastModified: Date.now(),
        owner: userId,
        showGrid: false,
        snapToGrid: true,
        quality: "original",
      };

      URL.revokeObjectURL(url);
      resolve({ map, assets });
    };
    image.onerror = reject;
    image.src = url;
  });
}
