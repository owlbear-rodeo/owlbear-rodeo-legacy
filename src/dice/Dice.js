import * as BABYLON from "babylonjs";

import d4Source from "./meshes/d4.glb";
import d6Source from "./meshes/d6.glb";
import d8Source from "./meshes/d8.glb";
import d10Source from "./meshes/d10.glb";
import d12Source from "./meshes/d12.glb";
import d20Source from "./meshes/d20.glb";
import d100Source from "./meshes/d100.glb";

import { diceTraySize } from "./diceTray/DiceTrayMesh";

import { lerp } from "../helpers/shared";

const minDiceRollSpeed = 400;
const maxDiceRollSpeed = 800;

class Dice {
  static instanceCount = 0;

  static async loadMeshes(material, scene, sourceOverrides) {
    let meshes = {};
    const addToMeshes = async (type, defaultSource) => {
      let source = sourceOverrides ? sourceOverrides[type] : defaultSource;
      const mesh = await this.loadMesh(source, material, scene);
      meshes[type] = mesh;
    };
    await addToMeshes("d4", d4Source);
    await addToMeshes("d6", d6Source);
    await addToMeshes("d8", d8Source);
    await addToMeshes("d10", d10Source);
    await addToMeshes("d12", d12Source);
    await addToMeshes("d20", d20Source);
    await addToMeshes("d100", d100Source);
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
      { mass: 10, friction: 4 },
      scene
    );

    return instance;
  }

  static roll(instance) {
    instance.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    instance.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());

    const trayOffsetHeight = diceTraySize.height / 2 - 0.5;
    const position = new BABYLON.Vector3(
      ((Math.random() * 2 - 1) * diceTraySize.width) / 2,
      5,
      Math.random() > 0.5 ? trayOffsetHeight : -trayOffsetHeight
    );
    instance.position = position;
    instance.addRotation(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    const impulse = new BABYLON.Vector3(0, 0, 0)
      .subtract(position)
      .normalizeToNew()
      .scale(lerp(minDiceRollSpeed, maxDiceRollSpeed, Math.random()));

    instance.physicsImpostor.applyImpulse(
      impulse,
      instance.physicsImpostor.getObjectCenter()
    );
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
