import { Vector3 } from "@babylonjs/core/Maths/math";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import {
  PhysicsImpostor,
  PhysicsImpostorParameters,
} from "@babylonjs/core/Physics/physicsImpostor";

import d4Source from "./shared/d4.glb";
import d6Source from "./shared/d6.glb";
import d8Source from "./shared/d8.glb";
import d10Source from "./shared/d10.glb";
import d12Source from "./shared/d12.glb";
import d20Source from "./shared/d20.glb";
import d100Source from "./shared/d100.glb";

import { lerp } from "../helpers/shared";
import { importTextureAsync } from "../helpers/babylon";
import {
  BaseTexture,
  InstancedMesh,
  Material,
  Mesh,
  Scene,
  Texture,
} from "@babylonjs/core";
import { DiceType } from "../types/Dice";

const minDiceRollSpeed = 600;
const maxDiceRollSpeed = 800;

class Dice {
  static instanceCount = 0;

  static async loadMeshes(
    material: Material,
    scene: Scene,
    sourceOverrides?: any
  ): Promise<Record<string, Mesh>> {
    let meshes: any = {};
    const addToMeshes = async (type: string | number, defaultSource: any) => {
      let source: string = sourceOverrides
        ? sourceOverrides[type]
        : defaultSource;
      const mesh = await this.loadMesh(source, material, scene);
      meshes[type] = mesh;
    };
    await Promise.all([
      addToMeshes("d4", d4Source),
      addToMeshes("d6", d6Source),
      addToMeshes("d8", d8Source),
      addToMeshes("d10", d10Source),
      addToMeshes("d12", d12Source),
      addToMeshes("d20", d20Source),
      addToMeshes("d100", d100Source),
    ]);
    return meshes;
  }

  static async loadMesh(source: string, material: Material, scene: Scene) {
    let mesh = (await SceneLoader.ImportMeshAsync("", source, "", scene))
      .meshes[1];
    mesh.setParent(null);

    mesh.material = material;

    mesh.receiveShadows = true;
    mesh.isVisible = false;
    return mesh;
  }

  static async loadMaterial(materialName: string, textures: any, scene: Scene) {
    let pbr = new PBRMaterial(materialName, scene);
    let [albedo, normal, metalRoughness]: [
      albedo: BaseTexture,
      normal: Texture,
      metalRoughness: Texture
    ] = await Promise.all([
      importTextureAsync(textures.albedo),
      importTextureAsync(textures.normal),
      importTextureAsync(textures.metalRoughness),
    ]);
    pbr.albedoTexture = albedo;
    // pbr.normalTexture = normal;
    pbr.bumpTexture = normal;
    pbr.metallicTexture = metalRoughness;
    pbr.useRoughnessFromMetallicTextureAlpha = false;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;
    return pbr;
  }

  static createInstanceFromMesh(
    mesh: Mesh,
    name: string,
    physicalProperties: PhysicsImpostorParameters,
    scene: Scene
  ) {
    let instance = mesh.createInstance(name);
    instance.position = mesh.position;
    for (let child of mesh.getChildTransformNodes()) {
      // TODO: type correctly another time -> should not be any
      const locator: any = child.clone(child.name, instance);
      // TODO: handle possible null value
      if (!locator) {
        throw Error;
      }
      locator.setAbsolutePosition(child.getAbsolutePosition());
      locator.name = child.name;
      instance.addChild(locator);
    }

    instance.physicsImpostor = new PhysicsImpostor(
      instance,
      PhysicsImpostor.ConvexHullImpostor,
      physicalProperties,
      scene
    );

    return instance;
  }

  static getDicePhysicalProperties(diceType: string) {
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

  static roll(instance: InstancedMesh) {
    instance.physicsImpostor?.setLinearVelocity(Vector3.Zero());
    instance.physicsImpostor?.setAngularVelocity(Vector3.Zero());

    const scene = instance.getScene();
    // TODO: remove any typing in this function -> this is just to get it working
    const diceTraySingle: any = scene.getNodeByID("dice_tray_single");
    const diceTrayDouble = scene.getNodeByID("dice_tray_double");
    const visibleDiceTray: any = diceTraySingle?.isVisible
      ? diceTraySingle
      : diceTrayDouble;
    const trayBounds = visibleDiceTray?.getBoundingInfo().boundingBox;

    const position = new Vector3(
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

    const throwTarget = new Vector3(
      lerp(trayBounds.minimumWorld.x, trayBounds.maximumWorld.x, Math.random()),
      5,
      lerp(trayBounds.minimumWorld.z, trayBounds.maximumWorld.z, Math.random())
    );

    const impulse = new Vector3(0, 0, 0)
      .subtract(throwTarget)
      .normalizeToNew()
      .scale(lerp(minDiceRollSpeed, maxDiceRollSpeed, Math.random()));

    instance.physicsImpostor?.applyImpulse(
      impulse,
      instance.physicsImpostor.getObjectCenter()
    );
  }

  static createInstanceMesh(
    mesh: Mesh,
    physicalProperties: PhysicsImpostorParameters,
    scene: Scene
  ): InstancedMesh {
    this.instanceCount++;

    return this.createInstanceFromMesh(
      mesh,
      `dice_instance_${this.instanceCount}`,
      physicalProperties,
      scene
    );
  }

  static async load(scene: Scene) {
    throw new Error(`Unable to load ${scene}`);
  }

  static createInstance(diceType: DiceType, scene: Scene): InstancedMesh {
    throw new Error(`No instance available for ${diceType} in ${scene}`);
  }
}

export default Dice;
