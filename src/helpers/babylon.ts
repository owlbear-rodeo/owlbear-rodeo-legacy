import { Texture } from "@babylonjs/core/Materials/Textures/texture";

// Turn texture load into an async function so it can be awaited
export async function importTextureAsync(url: string) {
  return new Promise((resolve, reject) => {
    let texture = new Texture(
      url,
      null,
      undefined,
      false,
      undefined,
      () => {
        resolve(texture);
      },
      () => {
        reject("Unable to load texture");
      }
    );
  });
}
