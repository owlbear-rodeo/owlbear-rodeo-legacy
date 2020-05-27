import React, { useRef, useEffect } from "react";
import * as BABYLON from "babylonjs";
import * as AMMO from "ammo.js";
import "babylonjs-loaders";
import ReactResizeDetector from "react-resize-detector";

import usePreventTouch from "../../../helpers/usePreventTouch";

const diceThrowSpeed = 2;

function DiceScene({ onSceneMount, onPointerDown, onPointerUp }) {
  const sceneRef = useRef();
  const engineRef = useRef();
  const canvasRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    // Enable physics
    scene.enablePhysics(
      new BABYLON.Vector3(0, -98, 0),
      new BABYLON.AmmoJSPlugin(true, AMMO)
    );

    let camera = new BABYLON.TargetCamera(
      "camera",
      new BABYLON.Vector3(0, 33.5, 0),
      scene
    );
    camera.fov = 0.65;
    camera.setTarget(BABYLON.Vector3.Zero());

    onSceneMount && onSceneMount({ scene, engine, canvas });

    engineRef.current = engine;
    sceneRef.current = scene;

    engine.runRenderLoop(() => {
      const scene = sceneRef.current;
      const selectedMesh = selectedMeshRef.current;
      if (selectedMesh && scene) {
        const ray = scene.createPickingRay(
          scene.pointerX,
          scene.pointerY,
          BABYLON.Matrix.Identity(),
          camera
        );
        const currentPosition = selectedMesh.getAbsolutePosition();
        let newPosition = ray.origin.scale(camera.globalPosition.y);
        newPosition.y = currentPosition.y;
        const delta = newPosition.subtract(currentPosition);
        selectedMesh.setAbsolutePosition(newPosition);
        const velocity = delta.scale(1000 / scene.deltaTime);
        selectedMeshVelocityWindowRef.current = selectedMeshVelocityWindowRef.current.slice(
          Math.max(
            selectedMeshVelocityWindowRef.current.length -
              selectedMeshVelocityWindowSize,
            0
          )
        );
        selectedMeshVelocityWindowRef.current.push(velocity);
      }
    });
  }, [onSceneMount]);

  const selectedMeshRef = useRef();
  const selectedMeshVelocityWindowRef = useRef([]);
  const selectedMeshVelocityWindowSize = 4;
  function handlePointerDown() {
    const scene = sceneRef.current;
    if (scene) {
      const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
      if (pickInfo.hit && pickInfo.pickedMesh.name !== "dice_tray") {
        pickInfo.pickedMesh.physicsImpostor.setLinearVelocity(
          BABYLON.Vector3.Zero()
        );
        pickInfo.pickedMesh.physicsImpostor.setAngularVelocity(
          BABYLON.Vector3.Zero()
        );
        selectedMeshRef.current = pickInfo.pickedMesh;
      }
    }
    onPointerDown();
  }

  function handlePointerUp() {
    const selectedMesh = selectedMeshRef.current;
    const velocityWindow = selectedMeshVelocityWindowRef.current;
    // Average velocity window
    let velocity = BABYLON.Vector3.Zero();
    for (let v of velocityWindow) {
      velocity.addInPlace(v);
    }
    if (velocityWindow.length > 0) {
      velocity.scaleInPlace(1 / velocityWindow.length);
    }
    const scene = sceneRef.current;
    if (selectedMesh && scene) {
      selectedMesh.physicsImpostor.applyImpulse(
        velocity.scale(diceThrowSpeed * selectedMesh.physicsImpostor.mass),
        selectedMesh.physicsImpostor.getObjectCenter()
      );
    }
    selectedMeshRef.current = null;
    selectedMeshVelocityWindowRef.current = [];

    onPointerUp();
  }

  function handleResize(width, height) {
    const engine = engineRef.current;
    engine.resize();
    canvasRef.current.width = width;
    canvasRef.current.height = height;
  }

  usePreventTouch(containerRef);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        overflow: "hidden",
      }}
      ref={containerRef}
    >
      <ReactResizeDetector handleWidth handleHeight onResize={handleResize}>
        <canvas
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          ref={canvasRef}
          style={{ outline: "none" }}
        />
      </ReactResizeDetector>
    </div>
  );
}

DiceScene.defaultProps = {
  onPointerDown() {},
  onPointerUp() {},
};

export default DiceScene;
