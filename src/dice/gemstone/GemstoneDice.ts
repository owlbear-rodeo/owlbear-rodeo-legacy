import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math";

import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

import { importTextureAsync } from "../../helpers/babylon";
import { Material, Mesh, Scene } from "@babylonjs/core";

class GemstoneDice extends Dice {
  static meshes: Record<string, Mesh>;
  static material: Material;

  static getDicePhysicalProperties(diceType: string) {
    let properties = super.getDicePhysicalProperties(diceType);
    return { mass: properties.mass * 1.5, friction: properties.friction };
  }

  static async loadMaterial(materialName: string, textures: any, scene: Scene) {
    let pbr = new PBRMaterial(materialName, scene);
    let [albedo, normal, metalRoughness] = await Promise.all([
      importTextureAsync(textures.albedo),
      importTextureAsync(textures.normal),
      importTextureAsync(textures.metalRoughness),
    ]);
    pbr.albedoTexture = albedo;
    // TODO: ask Mitch about texture
    pbr.bumpTexture = normal;
    pbr.metallicTexture = metalRoughness;
    pbr.useRoughnessFromMetallicTextureAlpha = false;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;

    pbr.subSurface.isTranslucencyEnabled = true;
    pbr.subSurface.translucencyIntensity = 0.2;
    pbr.subSurface.minimumThickness = 5;
    pbr.subSurface.maximumThickness = 10;
    pbr.subSurface.tintColor = new Color3(190 / 255, 0, 220 / 255);

    return pbr;
  }

  static async load(scene: Scene) {
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

  static createInstance(diceType: string, scene: Scene) {
    if (!this.material || !this.meshes) {
      throw Error("Dice not loaded, call load before creating an instance");
    }

    return Dice.createInstanceMesh(
      this.meshes[diceType],
      this.getDicePhysicalProperties(diceType),
      scene
    );
  }
}

export default GemstoneDice;
