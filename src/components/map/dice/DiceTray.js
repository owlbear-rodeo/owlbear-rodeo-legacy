import React, { useRef, useState, useCallback, useEffect } from "react";
import * as BABYLON from "babylonjs";
import { Box } from "theme-ui";

import environment from "../../../dice/environment.dds";

import ColorDice from "../../../dice/color/ColorDice";
import GemStoneDice from "../../../dice/gemStone/GemStoneDice";
import GlassDice from "../../../dice/glass/GlassDice";
import MetalDice from "../../../dice/metal/MetalDice";
import MetalStoneDice from "../../../dice/metalStone/MetalStoneDice";
import WoodDice from "../../../dice/wood/WoodDice";

import Scene from "./DiceScene";

function DiceTray({ isOpen }) {
  const sceneRef = useRef();
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
    var ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 100.0 },
      scene
    );
    ground.isVisible = false;

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

    createWall("wallTop", 0, -35, 0);
    createWall("wallRight", -35, 0, Math.PI / 2);
    createWall("wallBottom", 0, 35, Math.PI);
    createWall("wallLeft", 35, 0, -Math.PI / 2);

    var roof = BABYLON.Mesh.CreateGround("roof", 100, 100, 2, scene);
    roof.physicsImpostor = new BABYLON.PhysicsImpostor(
      roof,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 1.0 },
      scene
    );
    roof.position.y = 10;
    roof.isVisible = false;

    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
      environment,
      scene
    );
    scene.environmentIntensity = 1.5;
  }

  function update(scene) {
    const die = dieRef.current;
    const shouldSleep = sceneSleepRef.current;
    if (die.length === 0 || shouldSleep) {
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
        const newNumber = parseInt(highestLocator.name.slice(8));
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

  async function handleAddDice(style, type) {
    const scene = sceneRef.current;
    if (scene) {
      const instance = await style.createInstance(type, scene);
      dieRef.current.push(instance);
      dieSleepRef.current.push(false);
      setDieNumbers((prevNumbers) => [...prevNumbers, null]);
    }
  }

  return (
    <Box
      sx={{
        width: "500px",
        height: "500px",
        borderRadius: "4px",
        display: isOpen ? "box" : "none",
      }}
      bg="overlay"
    >
      <Scene onSceneMount={handleSceneMount} />
      <div
        style={{
          position: "absolute",
          top: "8px",
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
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <button onClick={() => handleAddDice(ColorDice, "d20")}>
          Add color d20
        </button>
        <button onClick={() => handleAddDice(GemStoneDice, "d20")}>
          Add gem d20
        </button>
        <button onClick={() => handleAddDice(GlassDice, "d20")}>
          Add glass d20
        </button>
        <button onClick={() => handleAddDice(MetalDice, "d20")}>
          Add metal d20
        </button>
        <button onClick={() => handleAddDice(MetalStoneDice, "d20")}>
          Add metal stone d20
        </button>
        <button onClick={() => handleAddDice(WoodDice, "d20")}>
          Add wood d20
        </button>
      </div>
    </Box>
  );
}

export default DiceTray;
