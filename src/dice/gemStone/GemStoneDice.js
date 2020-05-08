import * as BABYLON from "babylonjs";

import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

class GemStoneDice extends Dice {
  static meshes;
  static material;

  static loadMaterial(materialName, textures, scene) {
    let pbr = new BABYLON.PBRMaterial(materialName, scene);

    pbr.albedoTexture = new BABYLON.Texture(textures.albedo);
    pbr.normalTexture = new BABYLON.Texture(textures.normal);
    pbr.metallicTexture = new BABYLON.Texture(textures.metalRoughness);
    pbr.useRoughnessFromMetallicTextureAlpha = false;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;

    pbr.subSurface.isTranslucencyEnabled = true;
    pbr.subSurface.translucencyIntensity = 1.0;
    pbr.subSurface.minimumThickness = 5;
    pbr.subSurface.maximumThickness = 10;
    pbr.subSurface.tintColor = new BABYLON.Color3(0, 1, 0);

    return pbr;
  }

  static async createInstance(diceType, scene) {
    if (!this.material) {
      this.material = this.loadMaterial(
        "gem_stone_pbr",
        { albedo, metalRoughness, normal },
        scene
      );
    }
    if (!this.meshes) {
      this.meshes = await this.loadMeshes("round", this.material, scene);
    }

    return Dice.createInstance(this.meshes[diceType], scene);
  }
}

export default GemStoneDice;
