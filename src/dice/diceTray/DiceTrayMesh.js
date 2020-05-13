import * as BABYLON from "babylonjs";

import meshSource from "../meshes/diceTraySingle.glb";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

export const diceTraySize = { width: 8, height: 16 };

export default async function createDiceTray(scene, shadowGenerator) {
  let mesh = (
    await BABYLON.SceneLoader.ImportMeshAsync("", meshSource, "", scene)
  ).meshes[1];
  mesh.id = "tray";
  let material = new BABYLON.PBRMaterial("dice_tray_mat", scene);
  material.albedoTexture = new BABYLON.Texture(albedo);
  material.normalTexture = new BABYLON.Texture(normal);
  material.metallicTexture = new BABYLON.Texture(metalRoughness);
  material.useRoughnessFromMetallicTextureAlpha = false;
  material.useRoughnessFromMetallicTextureGreen = true;
  material.useMetallnessFromMetallicTextureBlue = true;
  mesh.material = material;

  mesh.receiveShadows = true;

  shadowGenerator.addShadowCaster(mesh);
}
