import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math";
import { Material, Scene } from "@babylonjs/core";

import Dice from "../Dice";

import albedo from "./albedo.jpg";
import mask from "./mask.png";
import normal from "./normal.jpg";

import { importTextureAsync } from "../../helpers/babylon";

import { BaseDiceTextureSources, DiceMeshes, DiceType } from "../../types/Dice";

type GlassDiceTextureSources = Pick<
  BaseDiceTextureSources,
  "albedo" | "normal"
> & { mask: string };

class GlassDice extends Dice {
  static meshes: DiceMeshes;
  static material: Material;

  static getDicePhysicalProperties(diceType: DiceType) {
    let properties = super.getDicePhysicalProperties(diceType);
    return { mass: properties.mass * 1.5, friction: properties.friction };
  }

  static async loadGlassMaterial(
    materialName: string,
    textures: GlassDiceTextureSources,
    scene: Scene
  ) {
    let pbr = new PBRMaterial(materialName, scene);
    let [albedo, normal, mask] = await Promise.all([
      importTextureAsync(textures.albedo),
      importTextureAsync(textures.normal),
      importTextureAsync(textures.mask),
    ]);
    pbr.albedoTexture = albedo;
    pbr.bumpTexture = normal;
    pbr.roughness = 0.25;
    pbr.metallic = 0;
    pbr.subSurface.isRefractionEnabled = true;
    pbr.subSurface.indexOfRefraction = 2.0;
    pbr.subSurface.refractionIntensity = 1.0;
    pbr.subSurface.isTranslucencyEnabled = true;
    pbr.subSurface.translucencyIntensity = 0.5;
    pbr.subSurface.minimumThickness = 10;
    pbr.subSurface.maximumThickness = 10;
    pbr.subSurface.tintColor = new Color3(43 / 255, 1, 115 / 255);
    pbr.subSurface.thicknessTexture = mask;
    pbr.subSurface.useMaskFromThicknessTexture = true;

    return pbr;
  }

  static async load(scene: Scene) {
    if (!this.material) {
      this.material = await this.loadGlassMaterial(
        "glass_pbr",
        { albedo, mask, normal },
        scene
      );
    }
    if (!this.meshes) {
      this.meshes = await this.loadMeshes(this.material, scene);
    }
  }

  static createInstance(diceType: DiceType, scene: Scene) {
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

export default GlassDice;
