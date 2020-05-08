import Dice from "../Dice";

import albedo from "./albedo.jpg";
import metalRoughness from "./metalRoughness.jpg";
import normal from "./normal.jpg";

class WoodDice extends Dice {
  static meshes;
  static material;

  static async createInstance(diceType, scene) {
    if (!this.material) {
      this.material = this.loadMaterial(
        "wood_pbr",
        { albedo, metalRoughness, normal },
        scene
      );
    }
    if (!this.meshes) {
      this.meshes = await this.loadMeshes("sharp", this.material, scene);
    }

    return Dice.createInstance(this.meshes[diceType], scene);
  }
}

export default WoodDice;
