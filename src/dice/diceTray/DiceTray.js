import * as BABYLON from "babylonjs";

import singleMeshSource from "../meshes/diceTraySingle.glb";
import doubleMeshSource from "../meshes/diceTrayDouble.glb";

import singleAlbedo from "./singleAlbedo.jpg";
import singleMetalRoughness from "./singleMetalRoughness.jpg";
import singleNormal from "./singleNormal.jpg";

import doubleAlbedo from "./doubleAlbedo.jpg";
import doubleMetalRoughness from "./doubleMetalRoughness.jpg";
import doubleNormal from "./doubleNormal.jpg";

class DiceTray {
  _size;
  get size() {
    return this._size;
  }
  set size(newSize) {
    this._size = newSize;
    const wallOffsetWidth = this.wallSize / 2 + this.width / 2 - 0.5;
    const wallOffsetHeight = this.wallSize / 2 + this.height / 2 - 0.5;
    this.wallTop.position.z = -wallOffsetHeight;
    this.wallRight.position.x = -wallOffsetWidth;
    this.wallBottom.position.z = wallOffsetHeight;
    this.wallLeft.position.x = wallOffsetWidth;
    this.singleMesh.isVisible = newSize === "single";
    this.doubleMesh.isVisible = newSize === "double";
  }
  scene;
  shadowGenerator;
  get width() {
    return this.size === "single" ? 10 : 20;
  }
  height = 20;
  wallSize = 50;
  wallTop;
  wallRight;
  wallBottom;
  wallLeft;
  singleMesh;
  doubleMesh;

  constructor(initialSize, scene, shadowGenerator) {
    this._size = initialSize;
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
  }

  async load() {
    this.loadWalls();
    await this.loadMeshes();
  }

  createWall(name, x, z, yaw) {
    let wall = BABYLON.Mesh.CreateBox(
      name,
      this.wallSize,
      this.scene,
      true,
      BABYLON.Mesh.DOUBLESIDE
    );
    wall.rotation = new BABYLON.Vector3(0, yaw, 0);
    wall.position.z = z;
    wall.position.x = x;
    wall.physicsImpostor = new BABYLON.PhysicsImpostor(
      wall,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 10.0 },
      this.scene
    );
    wall.isVisible = false;

    return wall;
  }

  loadWalls() {
    const wallOffsetWidth = this.wallSize / 2 + this.width / 2 - 0.5;
    const wallOffsetHeight = this.wallSize / 2 + this.height / 2 - 0.5;
    this.wallTop = this.createWall("wallTop", 0, -wallOffsetHeight, 0);
    this.wallRight = this.createWall(
      "wallRight",
      -wallOffsetWidth,
      0,
      Math.PI / 2
    );
    this.wallBottom = this.createWall(
      "wallBottom",
      0,
      wallOffsetHeight,
      Math.PI
    );
    this.wallLeft = this.createWall(
      "wallLeft",
      wallOffsetWidth,
      0,
      -Math.PI / 2
    );
  }

  async loadMeshes() {
    this.singleMesh = (
      await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        singleMeshSource,
        "",
        this.scene
      )
    ).meshes[1];
    this.singleMesh.id = "dice_tray_single";
    this.singleMesh.name = "dice_tray";
    let singleMaterial = new BABYLON.PBRMaterial(
      "dice_tray_mat_single",
      this.scene
    );
    singleMaterial.albedoTexture = new BABYLON.Texture(singleAlbedo);
    singleMaterial.normalTexture = new BABYLON.Texture(singleNormal);
    singleMaterial.metallicTexture = new BABYLON.Texture(singleMetalRoughness);
    singleMaterial.useRoughnessFromMetallicTextureAlpha = false;
    singleMaterial.useRoughnessFromMetallicTextureGreen = true;
    singleMaterial.useMetallnessFromMetallicTextureBlue = true;
    this.singleMesh.material = singleMaterial;

    this.singleMesh.receiveShadows = true;
    this.shadowGenerator.addShadowCaster(this.singleMesh);
    this.singleMesh.isVisible = this.size === "single";

    this.doubleMesh = (
      await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        doubleMeshSource,
        "",
        this.scene
      )
    ).meshes[1];
    this.doubleMesh.id = "dice_tray_double";
    this.doubleMesh.name = "dice_tray";
    let doubleMaterial = new BABYLON.PBRMaterial(
      "dice_tray_mat_double",
      this.scene
    );
    doubleMaterial.albedoTexture = new BABYLON.Texture(doubleAlbedo);
    doubleMaterial.normalTexture = new BABYLON.Texture(doubleNormal);
    doubleMaterial.metallicTexture = new BABYLON.Texture(doubleMetalRoughness);
    doubleMaterial.useRoughnessFromMetallicTextureAlpha = false;
    doubleMaterial.useRoughnessFromMetallicTextureGreen = true;
    doubleMaterial.useMetallnessFromMetallicTextureBlue = true;
    this.doubleMesh.material = doubleMaterial;

    this.doubleMesh.receiveShadows = true;
    this.shadowGenerator.addShadowCaster(this.doubleMesh);
    this.doubleMesh.isVisible = this.size === "double";
  }
}

export default DiceTray;
