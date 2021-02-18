import blobToBuffer from "./blobToBuffer";

const lightnessDetectionOffset = 0.1;

/**
 * @param {HTMLImageElement} image
 * @returns {boolean} True is the image is light
 */
export function getImageLightness(image) {
  const width = image.width;
  const height = image.height;
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, width, height);

  const data = imageData.data;
  let lightPixels = 0;
  let darkPixels = 0;
  // Loop over every pixels rgba values
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(Math.max(r, g), b);
    if (max < 128) {
      darkPixels++;
    } else {
      lightPixels++;
    }
  }

  const norm = (lightPixels - darkPixels) / (width * height);
  return norm + lightnessDetectionOffset >= 0;
}

/**
 * @typedef CanvasImage
 * @property {Blob|null} blob The blob of the resized image, `null` if the image was unable to be resized to that dimension
 * @property {number} width
 * @property {number} height
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} type
 * @param {number} quality
 * @returns {Promise<CanvasImage>}
 */
export async function canvasToImage(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve({ blob, width: canvas.width, height: canvas.height });
      },
      type,
      quality
    );
  });
}

/**
 * @param {HTMLImageElement} image the image to resize
 * @param {number} size the size of the longest edge of the new image
 * @param {string} type the mime type of the image
 * @param {number} quality if image is a jpeg or webp this is the quality setting
 * @returns {Promise<CanvasImage>}
 */
export async function resizeImage(image, size, type, quality) {
  const width = image.width;
  const height = image.height;
  const ratio = width / height;
  let canvas = document.createElement("canvas");
  if (ratio > 1) {
    canvas.width = size;
    canvas.height = Math.round(size / ratio);
  } else {
    canvas.width = Math.round(size * ratio);
    canvas.height = size;
  }
  let context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return await canvasToImage(canvas, type, quality);
}

/**
 * @typedef ImageFile
 * @property {Uint8Array|null} file
 * @property {number} width
 * @property {number} height
 * @property {"file"} type
 * @property {string} id
 */

/**
 * Create a image file with resolution `size`x`size` with cover cropping
 * @param {HTMLImageElement} image the image to resize
 * @param {string} type the mime type of the image
 * @param {number} size the width and height of the thumbnail
 * @param {number} quality if image is a jpeg or webp this is the quality setting
 * @returns {Promise<ImageFile>}
 */
export async function createThumbnail(image, type, size = 300, quality = 0.5) {
  let canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  let context = canvas.getContext("2d");
  const ratio = image.width / image.height;
  if (ratio > 1) {
    const center = image.width / 2;
    const halfHeight = image.height / 2;
    context.drawImage(
      image,
      center - halfHeight,
      0,
      image.height,
      image.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  } else {
    const center = image.height / 2;
    const halfWidth = image.width / 2;
    context.drawImage(
      image,
      0,
      center - halfWidth,
      image.width,
      image.width,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  const thumbnailImage = await canvasToImage(canvas, type, quality);

  let thumbnailBuffer = null;
  if (thumbnailImage.blob) {
    thumbnailBuffer = await blobToBuffer(thumbnailImage.blob);
  }
  return {
    file: thumbnailBuffer,
    width: thumbnailImage.width,
    height: thumbnailImage.height,
    type: "file",
    id: "thumbnail",
  };
}
