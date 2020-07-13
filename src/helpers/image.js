const lightnessDetectionOffset = 0.1;

/**
 * @returns {boolean} True is the image is light
 */
export function getImageLightness(image) {
  const imageWidth = image.width;
  const imageHeight = image.height;
  let canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  let context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, imageWidth, imageHeight);

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

  const norm = (lightPixels - darkPixels) / (imageWidth * imageHeight);
  return norm + lightnessDetectionOffset >= 0;
}
