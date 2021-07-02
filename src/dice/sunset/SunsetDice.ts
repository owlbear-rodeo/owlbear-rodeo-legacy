import { Material, Mesh, Scene } from "@babylonjs/core";
import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

class SunsetDice extends Dice {
  static meshes: Record<string, Mesh>;
  static material: Material;

  static async load(scene: Scene) {
    if (!this.material) {
      this.material = await this.loadMaterial(
        "sunset_pbr",
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

    return super.createInstanceMesh(
      this.meshes[diceType],
      this.getDicePhysicalProperties(diceType),
      scene
    );
  }
}

export default SunsetDice;