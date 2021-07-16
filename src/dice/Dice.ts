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
import { InstancedMesh, Material, Mesh, Scene } from "@babylonjs/core";
import {
  DiceType,
  BaseDiceTextureSources,
  isDiceMeshes,
  DiceMeshes,
} from "../types/Dice";

const minDiceRollSpeed = 600;
const maxDiceRollSpeed = 800;

class Dice {
  static instanceCount = 0;

  static async loadMeshes(
    material: Material,
    scene: Scene,
    sourceOverrides?: Record<DiceType, string>
  ): Promise<DiceMeshes> {
    let meshes: Partial<DiceMeshes> = {};
    const addToMeshes = async (type: DiceType, defaultSource: string) => {
      let source = sourceOverrides ? sourceOverrides[type] : defaultSource;
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
    if (isDiceMeshes(meshes)) {
      return meshes;
    } else {
      throw new Error("Dice meshes failed to load, missing mesh source");
    }
  }

  static async loadMesh(source: string, material: Material, scene: Scene) {
    let mesh = (await SceneLoader.ImportMeshAsync("", source, "", scene))
      .meshes[1] as Mesh;
    mesh.setParent(null);

    mesh.material = material;

    mesh.receiveShadows = true;
    mesh.isVisible = false;
    return mesh;
  }

  static async loadMaterial(
    materialName: string,
    textures: BaseDiceTextureSources,
    scene: Scene
  ) {
    let pbr = new PBRMaterial(materialName, scene);
    let [albedo, normal, metalRoughness] = await Promise.all([
      importTextureAsync(textures.albedo),
      importTextureAsync(textures.normal),
      importTextureAsync(textures.metalRoughness),
    ]);
    pbr.albedoTexture = albedo;
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
    for (let child of mesh.getChildMeshes()) {
      const locator = child.clone(child.name, instance);
      if (!locator) {
        throw new Error("Unable to clone dice locator");
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

  static getDicePhysicalProperties(diceType: DiceType) {
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
      case "d20":
        return { mass: 10, friction: 4 };
      default:
        return { mass: 10, friction: 4 };
    }
  }

  static roll(instance: InstancedMesh) {
    instance.physicsImpostor?.setLinearVelocity(Vector3.Zero());
    instance.physicsImpostor?.setAngularVelocity(Vector3.Zero());

    const scene = instance.getScene();
    const diceTraySingle = scene.getMeshByID("dice_tray_single");
    const diceTrayDouble = scene.getMeshByID("dice_tray_double");
    const visibleDiceTray = diceTraySingle?.isVisible
      ? diceTraySingle
      : diceTrayDouble;
    if (!visibleDiceTray) {
      throw new Error("No dice tray to roll in");
    }
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
