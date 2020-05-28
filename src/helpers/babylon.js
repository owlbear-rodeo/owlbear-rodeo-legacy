import * as BABYLON from "babylonjs";

// Turn texture load into an async function so it can be awaited
export async function importTextureAsync(url) {
  return new Promise((resolve, reject) => {
    let texture = new BABYLON.Texture(
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
