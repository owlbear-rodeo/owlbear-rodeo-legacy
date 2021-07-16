import { useRef, useEffect, useState } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3, Color4, Matrix } from "@babylonjs/core/Maths/math";
import { AmmoJSPlugin } from "@babylonjs/core/Physics/Plugins/ammoJSPlugin";
import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
//@ts-ignore
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
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

const diceThrowSpeed = 2;

type SceneMountEvent = {
  scene: Scene;
  engine: Engine;
  canvas: HTMLCanvasElement;
};

type SceneMountEventHandler = (event: SceneMountEvent) => void;

type DiceInteractionProps = {
  onSceneMount?: SceneMountEventHandler;
  onPointerDown: () => void;
  onPointerUp: () => void;
};

function DiceInteraction({
  onSceneMount,
  onPointerDown,
  onPointerUp,
}: DiceInteractionProps) {
  const [error, setError] = useState<Error | undefined>();

  const sceneRef = useRef<Scene>();
  const engineRef = useRef<Engine>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    try {
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
          selectedMeshVelocityWindowRef.current =
            selectedMeshVelocityWindowRef.current.slice(
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

  const selectedMeshRef = useRef<AbstractMesh | null>(null);
  const selectedMeshVelocityWindowRef = useRef<Vector3[]>([]);
  const selectedMeshVelocityWindowSize = 4;
  const selectedMeshMassRef = useRef<number>(0);
  function handlePointerDown() {
    const scene = sceneRef.current;
    if (scene) {
      const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
      if (
        pickInfo &&
        pickInfo.hit &&
        pickInfo.pickedMesh &&
        pickInfo.pickedMesh.name !== "dice_tray"
      ) {
        pickInfo.pickedMesh.physicsImpostor?.setLinearVelocity(Vector3.Zero());
        pickInfo.pickedMesh.physicsImpostor?.setAngularVelocity(Vector3.Zero());

        // Save the meshes mass and set it to 0 so we can pick it up
        selectedMeshMassRef.current =
          pickInfo.pickedMesh.physicsImpostor?.mass || 0;
        pickInfo.pickedMesh.physicsImpostor?.setMass(0);

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
      selectedMesh.physicsImpostor?.setMass(selectedMeshMassRef.current);
      selectedMesh.physicsImpostor?.forceUpdate();

      selectedMesh.physicsImpostor?.applyImpulse(
        velocity.scale(diceThrowSpeed * selectedMesh.physicsImpostor.mass),
        selectedMesh.physicsImpostor.getObjectCenter()
      );
    }
    selectedMeshRef.current = null;
    selectedMeshVelocityWindowRef.current = [];
    selectedMeshMassRef.current = 0;

    onPointerUp();
  }

  function handleResize(width?: number, height?: number) {
    if (width && height) {
      const engine = engineRef.current;
      if (engine && canvasRef.current) {
        engine.resize();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
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
      <ErrorBanner error={error} onRequestClose={() => setError(undefined)} />
    </div>
  );
}

DiceInteraction.defaultProps = {
  onPointerDown() {},
  onPointerUp() {},
};

export default DiceInteraction;
