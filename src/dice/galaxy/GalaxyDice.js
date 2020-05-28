import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

class GalaxyDice extends Dice {
  static meshes;
  static material;

  static async load(scene) {
    if (!this.material) {
      this.material = this.loadMaterial(
        "galaxy_pbr",
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

export default GalaxyDice;
