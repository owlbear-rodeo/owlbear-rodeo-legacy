declare module "image-outline" {
  type ImageOutlineOptions = {
    opacityThreshold?: number;
    simplifyThreshold?: number;
    pixelFn?: "opaque" | "not-white" | "not-black";
  };

  declare function imageOutline(
    imageElement: HTMLImageElement,
    options: ImageOutlineOptions
  ): { x: number; y: number }[];

  export default imageOutline;
}
