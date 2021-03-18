import React, { useRef, useEffect, useState } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3, Color4, Matrix } from "@babylonjs/core/Maths/math";
import { AmmoJSPlugin } from "@babylonjs/core/Physics/Plugins/ammoJSPlugin";
import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import * as AMMO from "ammo.js";

import "@babylonjs/core/Physics/physicsEngineComponent";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Materials/Textures/Loaders/ddsTextureLoader";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import "@babylonjs/core/Actions/actionManager";
import "@babylonjs/core/Culling/ray";
import "@babylonjs/loaders/glTF";

import ReactResizeDetector from "react-resize-detector";

import usePreventTouch from "../../hooks/usePreventTouch";

import ErrorBanner from "../banner/ErrorBanner";

const diceThrowSpeed = 2;

function DiceInteraction({ onSceneMount, onPointerDown, onPointerUp }) {
  const [error, setError] = useState();

  const sceneRef = useRef();
  const engineRef = useRef();
  const canvasRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0, 0, 0, 0);
      // Enable physics
      scene.enablePhysics(new Vector3(0, -98, 0), new AmmoJSPlugin(true, AMMO));

      let camera = new TargetCamera("camera", new Vector3(0, 33.5, 0), scene);
      camera.fov = 0.65;
      camera.setTarget(Vector3.Zero());

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
            Matrix.Identity(),
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
    } catch (error) {
      setError(error);
    }
  }, [onSceneMount]);

  const selectedMeshRef = useRef();
  const selectedMeshVelocityWindowRef = useRef([]);
  const selectedMeshVelocityWindowSize = 4;
  const selectedMeshMassRef = useRef();
  function handlePointerDown() {
    const scene = sceneRef.current;
    if (scene) {
      const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
      if (pickInfo.hit && pickInfo.pickedMesh.name !== "dice_tray") {
        pickInfo.pickedMesh.physicsImpostor.setLinearVelocity(Vector3.Zero());
        pickInfo.pickedMesh.physicsImpostor.setAngularVelocity(Vector3.Zero());

        // Save the meshes mass and set it to 0 so we can pick it up
        selectedMeshMassRef.current = pickInfo.pickedMesh.physicsImpostor.mass;
        pickInfo.pickedMesh.physicsImpostor.setMass(0);

        selectedMeshRef.current = pickInfo.pickedMesh;
      }
    }
    onPointerDown();
  }

  function handlePointerUp() {
    const selectedMesh = selectedMeshRef.current;
    const velocityWindow = selectedMeshVelocityWindowRef.current;
    const scene = sceneRef.current;
    if (selectedMesh && scene) {
      // Average velocity window
      let velocity = Vector3.Zero();
      for (let v of velocityWindow) {
        velocity.addInPlace(v);
      }
      if (velocityWindow.length > 0) {
        velocity.scaleInPlace(1 / velocityWindow.length);
      }

      // Re-apply the meshes mass
      selectedMesh.physicsImpostor.setMass(selectedMeshMassRef.current);
      selectedMesh.physicsImpostor.forceUpdate();

      selectedMesh.physicsImpostor.applyImpulse(
        velocity.scale(diceThrowSpeed * selectedMesh.physicsImpostor.mass),
        selectedMesh.physicsImpostor.getObjectCenter()
      );
    }
    selectedMeshRef.current = null;
    selectedMeshVelocityWindowRef.current = [];
    selectedMeshMassRef.current = null;

    onPointerUp();
  }

  function handleResize(width, height) {
    const engine = engineRef.current;
    if (engine) {
      engine.resize();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
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
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          ref={canvasRef}
          style={{ outline: "none" }}
        />
      </ReactResizeDetector>
      <ErrorBanner error={error} onRequestClose={() => setError()} />
    </div>
  );
}

DiceInteraction.defaultProps = {
  onPointerDown() {},
  onPointerUp() {},
};

export default DiceInteraction;
