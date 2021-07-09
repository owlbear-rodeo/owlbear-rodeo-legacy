import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

import d4Source from "./d4.glb";
import d6Source from "./d6.glb";
import d8Source from "./d8.glb";
import d10Source from "./d10.glb";
import d12Source from "./d12.glb";
import d20Source from "./d20.glb";
import d100Source from "./d100.glb";
import { Material, Mesh, Scene } from "@babylonjs/core";
import { DiceType } from "../../types/Dice";

const sourceOverrides = {
  d4: d4Source,
  d6: d6Source,
  d8: d8Source,
  d10: d10Source,
  d12: d12Source,
  d20: d20Source,
  d100: d100Source,
};

class WalnutDice extends Dice {
  static meshes: Record<DiceType, Mesh>;
  static material: Material;

  static getDicePhysicalProperties(diceType: string) {
    let properties = super.getDicePhysicalProperties(diceType);
    return { mass: properties.mass * 1.4, friction: properties.friction };
  }

  static async load(scene: Scene) {
    if (!this.material) {
      this.material = await this.loadMaterial(
        "walnut_pbr",
        { albedo, metalRoughness, normal },
        scene
      );
    }
    if (!this.meshes) {
      this.meshes = await this.loadMeshes(
        this.material,
        scene,
        sourceOverrides
      );
    }
  }

  static createInstance(diceType: DiceType, scene: Scene) {
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

export default WalnutDice;
