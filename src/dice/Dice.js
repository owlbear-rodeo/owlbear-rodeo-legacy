import * as BABYLON from "babylonjs";

import d4Source from "./shared/d4.glb";
import d6Source from "./shared/d6.glb";
import d8Source from "./shared/d8.glb";
import d10Source from "./shared/d10.glb";
import d12Source from "./shared/d12.glb";
import d20Source from "./shared/d20.glb";
import d100Source from "./shared/d100.glb";

import { lerp } from "../helpers/shared";

const minDiceRollSpeed = 600;
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

  static createInstanceFromMesh(mesh, name, physicalProperties, scene) {
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
      physicalProperties,
      scene
    );

    return instance;
  }

  static getDicePhysicalProperties(diceType) {
    switch (diceType) {
      case "d4":
        return { mass: 4, friction: 4 };
      case "d6":
        return { mass: 6, friction: 4 };
      case "d8":
        return { mass: 6.2, friction: 4 };
      case "d10":
      case "d100":
        return { mass: 7, friction: 4 };
      case "d12":
        return { mass: 8, friction: 4 };
      case "20":
        return { mass: 10, friction: 4 };
      default:
        return { mass: 10, friction: 4 };
    }
  }

  static roll(instance) {
    instance.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    instance.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());

    const scene = instance.getScene();
    const diceTraySingle = scene.getNodeByID("dice_tray_single");
    const diceTrayDouble = scene.getNodeByID("dice_tray_double");
    const visibleDiceTray = diceTraySingle.isVisible
      ? diceTraySingle
      : diceTrayDouble;
    const trayBounds = visibleDiceTray.getBoundingInfo().boundingBox;

    const position = new BABYLON.Vector3(
      trayBounds.center.x + (Math.random() * 2 - 1),
      8,
      trayBounds.center.z + (Math.random() * 2 - 1)
    );
    instance.position = position;
    instance.addRotation(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    const throwTarget = new BABYLON.Vector3(
      lerp(trayBounds.minimumWorld.x, trayBounds.maximumWorld.x, Math.random()),
      5,
      lerp(trayBounds.minimumWorld.z, trayBounds.maximumWorld.z, Math.random())
    );

    const impulse = new BABYLON.Vector3(0, 0, 0)
      .subtract(throwTarget)
      .normalizeToNew()
      .scale(lerp(minDiceRollSpeed, maxDiceRollSpeed, Math.random()));

    instance.physicsImpostor.applyImpulse(
      impulse,
      instance.physicsImpostor.getObjectCenter()
    );
  }

  static createInstance(mesh, physicalProperties, scene) {
    this.instanceCount++;

    return this.createInstanceFromMesh(
      mesh,
      `dice_instance_${this.instanceCount}`,
      physicalProperties,
      scene
    );
  }
}

export default Dice;
