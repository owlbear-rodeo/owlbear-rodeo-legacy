import { v4 as uuid } from "uuid";
import Case from "case";
import imageOutline from "image-outline";

import blobToBuffer from "./blobToBuffer";
import { createThumbnail } from "./image";
import Vector2 from "./Vector2";

export function createTokenState(token, position, userId) {
  let tokenState = {
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
    type: token.type,
    outline: token.outline,
    width: token.width,
    height: token.height,
  };
  if (token.type === "file") {
    tokenState.file = token.file;
  } else if (token.type === "default") {
    tokenState.key = token.key;
  }
  return tokenState;
}

export async function createTokenFromFile(file, userId) {
  if (!file) {
    return Promise.reject();
  }
  let name = "Unknown Token";
  if (file.name) {
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
      let assets = [];
      const thumbnailImage = await createThumbnail(image, file.type);
      const thumbnail = { ...thumbnailImage, id: uuid(), owner: userId };
      assets.push(thumbnail);

      const fileAsset = {
        id: uuid(),
        file: buffer,
        width: image.width,
        height: image.height,
        mime: file.type,
        owner: userId,
      };
      assets.push(fileAsset);

      let outline = imageOutline(image);
      if (outline.length > 100) {
        outline = Vector2.resample(outline, 100);
      }
      // Flatten and round outline to save on storage size
      outline = outline
        .map(({ x, y }) => [Math.round(x), Math.round(y)])
        .flat();

      const token = {
        name,
        thumbnail: thumbnail.id,
        file: fileAsset.id,
        id: uuid(),
        type: "file",
        created: Date.now(),
        lastModified: Date.now(),
        owner: userId,
        defaultSize: 1,
        defaultCategory: "character",
        defaultLabel: "",
        hideInSidebar: false,
        group: "",
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