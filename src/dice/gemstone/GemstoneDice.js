import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math";

import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

import { importTextureAsync } from "../../helpers/babylon";

class GemstoneDice extends Dice {
  static meshes;
  static material;

  static getDicePhysicalProperties(diceType) {
    let properties = super.getDicePhysicalProperties(diceType);
    return { mass: properties.mass * 1.5, friction: properties.friction };
  }

  static async loadMaterial(materialName, textures, scene) {
    let pbr = new PBRMaterial(materialName, scene);
    pbr.albedoTexture = await importTextureAsync(textures.albedo);
    pbr.normalTexture = await importTextureAsync(textures.normal);
    pbr.metallicTexture = await importTextureAsync(textures.metalRoughness);
    pbr.useRoughnessFromMetallicTextureAlpha = false;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;

    pbr.subSurface.isTranslucencyEnabled = true;
    pbr.subSurface.translucencyIntensity = 1.0;
    pbr.subSurface.minimumThickness = 5;
    pbr.subSurface.maximumThickness = 10;
    pbr.subSurface.tintColor = new Color3(190 / 255, 0, 220 / 255);

    return pbr;
  }

  static async load(scene) {
    if (!this.material) {
      this.material = await this.loadMaterial(
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
