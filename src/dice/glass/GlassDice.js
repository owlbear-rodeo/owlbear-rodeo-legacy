import * as BABYLON from "babylonjs";

import Dice from "../Dice";

import albedo from "./albedo.jpg";
import mask from "./mask.png";
import normal from "./normal.jpg";

class GlassDice extends Dice {
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
    pbr.roughness = 0.25;
    pbr.metallic = 0;
    pbr.subSurface.isRefractionEnabled = true;
    pbr.subSurface.indexOfRefraction = 2.0;
    pbr.subSurface.refractionIntensity = 1.2;
    pbr.subSurface.isTranslucencyEnabled = true;
    pbr.subSurface.translucencyIntensity = 2.5;
    pbr.subSurface.minimumThickness = 10;
    pbr.subSurface.maximumThickness = 10;
    pbr.subSurface.tintColor = new BABYLON.Color3(43 / 255, 1, 115 / 255);
    pbr.subSurface.thicknessTexture = new BABYLON.Texture(textures.mask);
    pbr.subSurface.useMaskFromThicknessTexture = true;

    return pbr;
  }

  static async load(scene) {
    if (!this.material) {
      this.material = this.loadMaterial(
        "glass_pbr",
        { albedo, mask, normal },
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

export default GlassDice;
