import * as BABYLON from "babylonjs";

import Dice from "../Dice";

import albedo from "./albedo.png";
import mask from "./mask.png";
import normal from "./normal.jpg";

class GlassDice extends Dice {
  static meshes;
  static material;

  static loadMaterial(materialName, textures, scene) {
    let pbr = new BABYLON.PBRMaterial(materialName, scene);
    pbr.albedoTexture = new BABYLON.Texture(textures.albedo);
    pbr.normalTexture = new BABYLON.Texture(textures.normal);

    pbr.roughness = 0.25;
    pbr.metallic = 0;

    pbr.subSurface.isRefractionEnabled = true;
    pbr.subSurface.indexOfRefraction = 1.0;
    pbr.subSurface.isTranslucencyEnabled = true;
    pbr.subSurface.translucencyIntensity = 1.0;
    pbr.subSurface.minimumThickness = 10;
    pbr.subSurface.maximumThickness = 10;
    pbr.subSurface.tintColor = new BABYLON.Color3(43 / 255, 1, 115 / 255);
    pbr.subSurface.thicknessTexture = new BABYLON.Texture(textures.mask);
    pbr.subSurface.useMaskFromThicknessTexture = true;

    return pbr;
  }

  static async createInstance(diceType, scene) {
    if (!this.material) {
      this.material = this.loadMaterial(
        "glass_pbr",
        { albedo, mask, normal },
        scene
      );
    }
    if (!this.meshes) {
      this.meshes = await this.loadMeshes("round", this.material, scene);
    }
    return Dice.createInstance(this.meshes[diceType], scene);
  }
}

export default GlassDice;
