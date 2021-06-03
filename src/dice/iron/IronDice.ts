import { Material, Mesh, Scene } from "@babylonjs/core";
import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

class IronDice extends Dice {
  static meshes: Record<string, Mesh>;
  static material: Material;

  static getDicePhysicalProperties(diceType: string) {
    let properties = super.getDicePhysicalProperties(diceType);
    return { mass: properties.mass * 2, friction: properties.friction };
  }

  static async load(scene: Scene) {
    if (!this.material) {
      this.material = await this.loadMaterial(
        "iron_pbr",
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

export default IronDice;
