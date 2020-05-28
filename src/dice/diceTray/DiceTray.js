import * as BABYLON from "babylonjs";

import singleMeshSource from "./single.glb";
import doubleMeshSource from "./double.glb";

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
    const wallOffsetWidth = this.collisionSize / 2 + this.width / 2 - 0.5;
    const wallOffsetHeight = this.collisionSize / 2 + this.height / 2 - 0.5;
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
  collisionSize = 50;
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

  createCollision(name, x, y, z, friction) {
    let collision = BABYLON.Mesh.CreateBox(
      name,
      this.collisionSize,
      this.scene,
      true,
      BABYLON.Mesh.DOUBLESIDE
    );
    collision.position.x = x;
    collision.position.y = y;
    collision.position.z = z;
    collision.physicsImpostor = new BABYLON.PhysicsImpostor(
      collision,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: friction },
      this.scene
    );
    collision.isVisible = false;

    return collision;
  }

  loadWalls() {
    const wallOffsetWidth = this.collisionSize / 2 + this.width / 2 - 0.5;
    const wallOffsetHeight = this.collisionSize / 2 + this.height / 2 - 0.5;
    this.wallTop = this.createCollision("wallTop", 0, 0, -wallOffsetHeight, 10);
    this.wallRight = this.createCollision(
      "wallRight",
      -wallOffsetWidth,
      0,
      0,
      10
    );
    this.wallBottom = this.createCollision(
      "wallBottom",
      0,
      0,
      wallOffsetHeight,
      10
    );
    this.wallLeft = this.createCollision("wallLeft", wallOffsetWidth, 0, 0, 10);
    const diceTrayGroundOffset = 0.32;
    this.createCollision(
      "ground",
      0,
      -this.collisionSize / 2 + diceTrayGroundOffset,
      0,
      20
    );
    const diceTrayRoofOffset = 10;
    this.createCollision(
      "roof",
      0,
      this.collisionSize / 2 + diceTrayRoofOffset,
      0,
      100
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
