import React, { useRef, useState, useCallback, useEffect } from "react";
import * as BABYLON from "babylonjs";
import { Box } from "theme-ui";

import environment from "../../../dice/environment.dds";

import Scene from "./DiceScene";
import DiceControls from "./DiceControls";

import createDiceTray from "../../../dice/diceTray/DiceTrayMesh";

function DiceTray({ isOpen }) {
  const sceneRef = useRef();
  const shadowGeneratorRef = useRef();
  const dieRef = useRef([]);
  const dieSleepRef = useRef([]);
  const [dieNumbers, setDieNumbers] = useState([]);

  const sceneSleepRef = useRef(true);

  useEffect(() => {
    if (!isOpen) {
      sceneSleepRef.current = true;
    } else {
      sceneSleepRef.current = false;
    }
  }, [isOpen]);

  const handleSceneMount = useCallback(({ scene, engine }) => {
    sceneRef.current = scene;
    initializeScene(scene);
    engine.runRenderLoop(() => update(scene));
  }, []);

  async function initializeScene(scene) {
    var light = new BABYLON.DirectionalLight(
      "DirectionalLight",
      new BABYLON.Vector3(-0.5, -1, -0.5),
      scene
    );
    light.position = new BABYLON.Vector3(5, 10, 5);
    light.shadowMinZ = 1;
    light.shadowMaxZ = 50;
    let shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useCloseExponentialShadowMap = true;
    shadowGenerator.darkness = 0.7;
    shadowGeneratorRef.current = shadowGenerator;

    var ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 100.0 },
      scene
    );
    ground.isVisible = false;
    ground.position.y = 0.2;

    function createWall(name, x, z, yaw) {
      let wall = BABYLON.Mesh.CreateBox(
        name,
        50,
        scene,
        true,
        BABYLON.Mesh.DOUBLESIDE
      );
      wall.rotation = new BABYLON.Vector3(0, yaw, 0);
      wall.position.z = z;
      wall.position.x = x;
      wall.physicsImpostor = new BABYLON.PhysicsImpostor(
        wall,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 1.0 },
        scene
      );
      wall.isVisible = false;
    }

    createWall("wallTop", 0, -32.5, 0);
    createWall("wallRight", -28.5, 0, Math.PI / 2);
    createWall("wallBottom", 0, 32.5, Math.PI);
    createWall("wallLeft", 28.5, 0, -Math.PI / 2);

    var roof = BABYLON.Mesh.CreateGround("roof", 100, 100, 2, scene);
    roof.physicsImpostor = new BABYLON.PhysicsImpostor(
      roof,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 1.0 },
      scene
    );
    roof.position.y = 5;
    roof.isVisible = false;

    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
      environment,
      scene
    );
    scene.environmentIntensity = 1.0;

    createDiceTray(scene, shadowGenerator);
  }

  function update(scene) {
    const die = dieRef.current;
    const shouldSleep = sceneSleepRef.current;
    if (shouldSleep) {
      return;
    }

    for (let i = 0; i < die.length; i++) {
      const dice = die[i];
      const diceAsleep = dieSleepRef.current[i];
      const speed = dice.physicsImpostor.getLinearVelocity().length();
      if (speed < 0.01 && !diceAsleep) {
        let highestDot = -1;
        let highestLocator;
        for (let locator of dice.getChildTransformNodes()) {
          let dif = locator
            .getAbsolutePosition()
            .subtract(dice.getAbsolutePosition());
          let direction = dif.normalize();
          const dot = BABYLON.Vector3.Dot(direction, BABYLON.Vector3.Up());
          if (dot > highestDot) {
            highestDot = dot;
            highestLocator = locator;
          }
        }
        dieSleepRef.current[i] = true;
        const newNumber = parseInt(highestLocator.name.slice(12));
        setDieNumbers((prevNumbers) => {
          let newNumbers = [...prevNumbers];
          newNumbers[i] = newNumber;
          return newNumbers;
        });
      } else if (speed > 0.5 && diceAsleep) {
        dieSleepRef.current[i] = false;
        setDieNumbers((prevNumbers) => {
          let newNumbers = [...prevNumbers];
          newNumbers[i] = null;
          return newNumbers;
        });
      }
    }
    if (scene) {
      scene.render();
    }
  }

  async function handleDiceAdd(style, type) {
    const scene = sceneRef.current;
    const shadowGenerator = shadowGeneratorRef.current;
    if (scene && shadowGenerator) {
      const instance = await style.createInstance(type, scene);
      shadowGenerator.addShadowCaster(instance);
      dieRef.current.push(instance);
      dieSleepRef.current.push(false);
      setDieNumbers((prevNumbers) => [...prevNumbers, null]);
    }
  }

  return (
    <Box
      sx={{
        width: "300px",
        height: "600px",
        borderRadius: "4px",
        display: isOpen ? "block" : "none",
        position: "relative",
        overflow: "hidden",
      }}
      bg="background"
    >
      <Scene onSceneMount={handleSceneMount} />
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          color: "white",
        }}
      >
        {dieNumbers.map((num, index) => (
          <h3 key={index}>
            {num || "?"}
            {index === dieNumbers.length - 1 ? "" : "+"}
          </h3>
        ))}
        <h3>
          {dieNumbers.length > 0 &&
            `= ${dieNumbers.reduce((a, b) => (a || 0) + (b || 0))}`}
        </h3>
      </div>
      <div
        style={{
          position: "absolute",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <DiceControls onDiceAdd={handleDiceAdd} />
      </div>
    </Box>
  );
}

export default DiceTray;
