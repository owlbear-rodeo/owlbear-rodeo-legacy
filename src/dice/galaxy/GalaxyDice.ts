import { InstancedMesh, Material, Scene } from "@babylonjs/core";
import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

import { DiceMeshes, DiceType } from "../../types/Dice";

class GalaxyDice extends Dice {
  static meshes: DiceMeshes;
  static material: Material;

  static async load(scene: Scene) {
    if (!this.material) {
      this.material = await this.loadMaterial(
        "galaxy_pbr",
        { albedo, metalRoughness, normal },
        scene
      );
    }
    if (!this.meshes) {
      this.meshes = await this.loadMeshes(this.material, scene);
    }
  }

  static createInstance(diceType: DiceType, scene: Scene): InstancedMesh {
    if (!this.material || !this.meshes) {
      throw Error("Dice not loaded, call load before creating an instance");
    }

    return super.createInstanceMesh(
      this.meshes[diceType],
      this.getDicePhysicalProperties(diceType),
      scene
    );
  }
}

export default GalaxyDice;
