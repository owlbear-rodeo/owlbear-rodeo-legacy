import React, { useRef, useEffect } from "react";
import * as BABYLON from "babylonjs";
import * as AMMO from "ammo.js";
import "babylonjs-loaders";
import ReactResizeDetector from "react-resize-detector";

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
      new BABYLON.Vector3(0, 34, 0),
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
        selectedMeshDeltaPositionRef.current = delta;
      }
    });
  }, [onSceneMount]);

  const selectedMeshRef = useRef();
  const selectedMeshDeltaPositionRef = useRef();
  function handlePointerDown() {
    const scene = sceneRef.current;
    if (scene) {
      const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
      if (pickInfo.hit && pickInfo.pickedMesh.id !== "tray") {
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
    const deltaPosition = selectedMeshDeltaPositionRef.current;
    const scene = sceneRef.current;
    if (selectedMesh && scene && deltaPosition) {
      let impulse = deltaPosition.scale(1000 / scene.deltaTime);
      impulse.scale(5);
      impulse.y = Math.max(impulse.length() * 0.1, 0.5);
      selectedMesh.physicsImpostor.applyImpulse(
        impulse,
        selectedMesh
          .getAbsolutePosition()
          .add(new BABYLON.Vector3(0, Math.random() * 0.5 + 0.5, 0))
      );
    }
    selectedMeshRef.current = null;
    selectedMeshDeltaPositionRef.current = null;

    onPointerUp();
  }

  function handleResize(width, height) {
    const engine = engineRef.current;
    engine.resize();
    canvasRef.current.width = width;
    canvasRef.current.height = height;
  }

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
