import * as BABYLON from "babylonjs";

import d20SharpSource from "./meshes/d20Sharp.glb";
import d20RoundSource from "./meshes/d20Round.glb";

class Dice {
  static instanceCount = 0;

  static async loadMeshes(diceStyle, material, scene) {
    let meshes = {};
    const d20Source = diceStyle === "round" ? d20RoundSource : d20SharpSource;
    const d20Mesh = await this.loadMesh(d20Source, material, scene);
    meshes.d20 = d20Mesh;
    return meshes;
  }

  static async loadMesh(source, material, scene) {
    let mesh = (
      await BABYLON.SceneLoader.ImportMeshAsync("", source, "", scene)
    ).meshes[1];
    mesh.setParent(null);

    mesh.material = material;

    mesh.receiveShadows = true;
    mesh.isVisible = false;
    return mesh;
  }

  static loadMaterial(materialName, textures, scene) {
    let pbr = new BABYLON.PBRMaterial(materialName, scene);
    pbr.albedoTexture = new BABYLON.Texture(textures.albedo);
    pbr.normalTexture = new BABYLON.Texture(textures.normal);
    pbr.metallicTexture = new BABYLON.Texture(textures.metalRoughness);
    pbr.useRoughnessFromMetallicTextureAlpha = false;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;
    return pbr;
  }

  static createInstanceFromMesh(mesh, name, scene) {
    let instance = mesh.createInstance(name);
    instance.position = mesh.position;
    for (let child of mesh.getChildTransformNodes()) {
      const locator = child.clone();
      locator.setAbsolutePosition(child.getAbsolutePosition());
      locator.name = child.name;
      instance.addChild(locator);
    }

    instance.physicsImpostor = new BABYLON.PhysicsImpostor(
      instance,
      BABYLON.PhysicsImpostor.ConvexHullImpostor,
      { mass: 1, friction: 50 },
      scene
    );

    // TODO: put in random start position
    instance.position.y = 2;

    return instance;
  }

  static async createInstance(mesh, scene) {
    this.instanceCount++;

    return this.createInstanceFromMesh(
      mesh,
      `dice_instance_${this.instanceCount}`,
      scene
    );
  }
}

export default Dice;
