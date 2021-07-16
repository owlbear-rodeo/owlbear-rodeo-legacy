import { v4 as uuid } from "uuid";
import Case from "case";
import Konva from "konva";

import blobToBuffer from "./blobToBuffer";
import { createThumbnail, getImageOutline } from "./image";
import Vector2 from "./Vector2";

import { Token, FileToken } from "../types/Token";
import { TokenState, BaseTokenState } from "../types/TokenState";
import { Asset } from "../types/Asset";
import { Outline } from "../types/Outline";

export function createTokenState(
  token: Token,
  position: Vector2,
  userId: string
): TokenState {
  let tokenState: BaseTokenState = {
    id: uuid(),
    tokenId: token.id,
    owner: userId,
    size: token.defaultSize,
    category: token.defaultCategory,
    label: token.defaultLabel,
    statuses: [],
    x: position.x,
    y: position.y,
    lastModifiedBy: userId,
    lastModified: Date.now(),
    rotation: 0,
    locked: false,
    visible: true,
    outline: token.outline,
    width: token.width,
    height: token.height,
  };
  if (token.type === "file") {
    return {
      ...tokenState,
      type: "file",
      file: token.file,
    };
  } else {
    return {
      ...tokenState,
      type: "default",
      key: token.key,
    };
  }
}

export async function createTokenFromFile(
  file: File,
  userId: string
): Promise<{ token: Token; assets: Asset[] }> {
  if (!file) {
    return Promise.reject();
  }
  let name = "Unknown Token";
  let defaultSize = 1;
  if (file.name) {
    if (file.name.matchAll) {
      // Match against a regex to find the grid size in the file name
      // e.g. Cave 22x23 will return [["22x22", "22", "x", "23"]]
      const sizeMatches = [...file.name.matchAll(/(\d+) ?(x|X) ?(\d+)/g)];
      for (let match of sizeMatches) {
        const matchX = parseInt(match[1]);
        const matchY = parseInt(match[3]);
        if (
          !isNaN(matchX) &&
          !isNaN(matchY) &&
          matchX < 256 // Add check to test match isn't resolution
        ) {
          defaultSize = matchX;
        }
      }
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
  let image = new Image();
  const buffer = await blobToBuffer(file);

  // Copy file to avoid permissions issues
  const blob = new Blob([buffer]);
  // Create and load the image temporarily to get its dimensions
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    image.onload = async function () {
      let assets: Asset[] = [];
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

      const outline = getImageOutline(image);

      const token: FileToken = {
        name,
        defaultSize,
        thumbnail: thumbnailId,
        file: fileAsset.id,
        id: uuid(),
        type: "file",
        created: Date.now(),
        lastModified: Date.now(),
        owner: userId,
        defaultCategory: "character",
        defaultLabel: "",
        hideInSidebar: false,
        width: image.width,
        height: image.height,
        outline,
      };

      URL.revokeObjectURL(url);
      resolve({ token, assets });
    };
    image.onerror = reject;
    image.src = url;
  });
}

export function clientPositionToMapPosition(
  mapStage: Konva.Stage,
  clientPosition: Vector2,
  checkMapBounds = true
): Vector2 | undefined {
  const mapImage = mapStage.findOne("#mapImage");
  const map = document.querySelector(".map");
  if (!map) {
    return;
  }
  const mapRect = map.getBoundingClientRect();

  // Check map bounds
  if (
    checkMapBounds &&
    (clientPosition.x < mapRect.left ||
      clientPosition.x > mapRect.right ||
      clientPosition.y < mapRect.top ||
      clientPosition.y > mapRect.bottom)
  ) {
    return;
  }

  // Convert relative to map rect
  const mapPosition = {
    x: clientPosition.x - mapRect.left,
    y: clientPosition.y - mapRect.top,
  };

  // Convert relative to map image
  const transform = mapImage.getAbsoluteTransform().copy().invert();
  const relativePosition = transform.point(mapPosition);
  const normalizedPosition = {
    x: relativePosition.x / mapImage.width(),
    y: relativePosition.y / mapImage.height(),
  };

  return normalizedPosition;
}

export function getScaledOutline(
  tokenState: TokenState,
  tokenWidth: number,
  tokenHeight: number
): Outline {
  let outline = tokenState.outline;
  if (outline.type === "rect") {
    return {
      ...outline,
      x: (outline.x / tokenState.width) * tokenWidth,
      y: (outline.y / tokenState.height) * tokenHeight,
      width: (outline.width / tokenState.width) * tokenWidth,
      height: (outline.height / tokenState.height) * tokenHeight,
    };
  } else if (outline.type === "circle") {
    return {
      ...outline,
      x: (outline.x / tokenState.width) * tokenWidth,
      y: (outline.y / tokenState.height) * tokenHeight,
      radius: (outline.radius / tokenState.width) * tokenWidth,
    };
  } else {
    let points = [...outline.points]; // Copy array so we can edit it imutably
    for (let i = 0; i < points.length; i += 2) {
      // Scale outline to the token
      points[i] = (points[i] / tokenState.width) * tokenWidth;
      points[i + 1] = (points[i + 1] / tokenState.height) * tokenHeight;
    }
    return { ...outline, points };
  }
}

export class Intersection {
  outline;
  position;
  center;
  rotation;
  points: Vector2[] | undefined;
  /**
   * @param {Outline} outline
   * @param {Vector2} position - Top left position of the token
   * @param {Vector2} center - Center position of the token
   * @param {number} rotation - Rotation of the token in degrees
   */
  constructor(
    outline: Outline,
    position: Vector2,
    center: Vector2,
    rotation: number
  ) {
    this.outline = outline;
    this.position = position;
    this.center = center;
    this.rotation = rotation;
    // Save points for intersection
    if (outline.type === "rect") {
      this.points = [
        Vector2.rotate(
          Vector2.add(new Vector2(outline.x, outline.y), position),
          center,
          rotation
        ),
        Vector2.rotate(
          Vector2.add(
            new Vector2(outline.x + outline.width, outline.y),
            position
          ),
          center,
          rotation
        ),
        Vector2.rotate(
          Vector2.add(
            new Vector2(outline.x + outline.width, outline.y + outline.height),
            position
          ),
          center,
          rotation
        ),
        Vector2.rotate(
          Vector2.add(
            new Vector2(outline.x, outline.y + outline.height),
            position
          ),
          center,
          rotation
        ),
      ];
    } else if (outline.type === "path") {
      this.points = [];
      for (let i = 0; i < outline.points.length; i += 2) {
        this.points.push(
          Vector2.rotate(
            Vector2.add(
              new Vector2(outline.points[i], outline.points[i + 1]),
              position
            ),
            center,
            rotation
          )
        );
      }
    }
  }

  /**
   * @param {Vector2} point
   * @returns {boolean}
   */
  intersects(point: Vector2) {
    if (
      this.points &&
      (this.outline.type === "rect" || this.outline.type === "path")
    ) {
      return Vector2.pointInPolygon(point, this.points);
    } else if (this.outline.type === "circle") {
      return Vector2.distance(this.center, point) < this.outline.radius;
    }
    return false;
  }
}
