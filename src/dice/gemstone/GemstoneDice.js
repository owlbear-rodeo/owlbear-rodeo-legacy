import * as BABYLON from "babylonjs";

import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

class GemstoneDice extends Dice {
  static meshes;
  static material;

  static getDicePhysicalProperties(diceType) {
    let properties = super.getDicePhysicalProperties(diceType);
    return { mass: properties.mass * 1.5, friction: properties.friction };
  }

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
    pbr.subSurface.tintColor = new BABYLON.Color3(190 / 255, 0, 220 / 255);

    return pbr;
  }

  static async load(scene) {
    if (!this.material) {
      this.material = this.loadMaterial(
        "gemstone_pbr",
        { albedo, metalRoughness, normal },
        scene
      );
    }
    if (!this.meshes) {
      this.meshes = await this.loadMeshes(this.material, scene);
    }
  }

  static createInstance(diceType, scene) {
    if (!this.material || !this.meshes) {
      throw Error("Dice not loaded, call load before creating an instance");
    }

    return Dice.createInstance(
      this.meshes[diceType],
      this.getDicePhysicalProperties(diceType),
      scene
    );
  }
}

export default GemstoneDice;
