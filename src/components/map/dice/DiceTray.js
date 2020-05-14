import React, { useRef, useState, useCallback, useEffect } from "react";
import * as BABYLON from "babylonjs";
import { Box } from "theme-ui";

import environment from "../../../dice/environment.dds";

import Scene from "./DiceScene";
import DiceControls from "./DiceControls";

import createDiceTray, {
  diceTraySize,
} from "../../../dice/diceTray/DiceTrayMesh";

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

    const wallSize = 50;

    function createWall(name, x, z, yaw) {
      let wall = BABYLON.Mesh.CreateBox(
        name,
        wallSize,
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

    const wallOffsetWidth = wallSize / 2 + diceTraySize.width / 2 - 0.5;
    const wallOffsetHeight = wallSize / 2 + diceTraySize.height / 2 - 0.5;
    createWall("wallTop", 0, -wallOffsetHeight, 0);
    createWall("wallRight", -wallOffsetWidth, 0, Math.PI / 2);
    createWall("wallBottom", 0, wallOffsetHeight, Math.PI);
    createWall("wallLeft", wallOffsetWidth, 0, -Math.PI / 2);

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
      const diceIsAsleep = dieSleepRef.current[i];
      const speed = getDiceSpeed(dice);
      if (speed < 0.01 && !diceIsAsleep) {
        dieSleepRef.current[i] = true;
        let newNumber = getDiceNumber(dice);
        setDieNumbers((prevNumbers) => {
          let newNumbers = [...prevNumbers];
          newNumbers[i] = newNumber;
          return newNumbers;
        });
      } else if (speed > 0.5 && diceIsAsleep) {
        dieSleepRef.current[i] = false;
        setDieNumbers((prevNumbers) => {
          let newNumbers = [...prevNumbers];
          newNumbers[i] = "unknown";
          return newNumbers;
        });
      }
    }
    if (scene) {
      scene.render();
    }
  }

  function getDiceSpeed(dice) {
    const diceSpeed = dice.instance.physicsImpostor
      .getLinearVelocity()
      .length();
    // If the dice is a d100 check the d10 as well
    if (dice.type === "d100") {
      const d10Speed = dice.d10Instance.physicsImpostor
        .getLinearVelocity()
        .length();
      return Math.max(diceSpeed, d10Speed);
    } else {
      return diceSpeed;
    }
  }

  // Find the number facing up on a dice object
  function getDiceNumber(dice) {
    let number = getDiceInstanceNumber(dice.instance);
    // If the dice is a d100 add the d10
    if (dice.type === "d100") {
      const d10Number = getDiceInstanceNumber(dice.d10Instance);
      // Both zero set to 100
      if (d10Number === 0 && number === 0) {
        number = 100;
      } else {
        number += d10Number;
      }
    } else if (dice.type === "d10" && number === 0) {
      number = 10;
    }
    return number;
  }

  // Find the number facing up on a mesh instance of a dice
  function getDiceInstanceNumber(instance) {
    let highestDot = -1;
    let highestLocator;
    for (let locator of instance.getChildTransformNodes()) {
      let dif = locator
        .getAbsolutePosition()
        .subtract(instance.getAbsolutePosition());
      let direction = dif.normalize();
      const dot = BABYLON.Vector3.Dot(direction, BABYLON.Vector3.Up());
      if (dot > highestDot) {
        highestDot = dot;
        highestLocator = locator;
      }
    }
    return parseInt(highestLocator.name.slice(12));
  }

  async function handleDiceAdd(style, type) {
    const scene = sceneRef.current;
    const shadowGenerator = shadowGeneratorRef.current;
    if (scene && shadowGenerator) {
      const instance = await style.createInstance(type, scene);
      shadowGenerator.addShadowCaster(instance);
      let dice = { type, instance };
      // If we have a d100 add a d10 as well
      if (type === "d100") {
        const d10Instance = await style.createInstance("d10", scene);
        shadowGenerator.addShadowCaster(d10Instance);
        dice.d10Instance = d10Instance;
      }
      dieRef.current.push(dice);
      dieSleepRef.current.push(false);
      setDieNumbers((prevNumbers) => [...prevNumbers, "unknown"]);
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
      {!dieNumbers.includes("unknown") && (
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
              {num}
              {index === dieNumbers.length - 1 ? "" : "+"}
            </h3>
          ))}
          <h3>
            {dieNumbers.length > 0 && `= ${dieNumbers.reduce((a, b) => a + b)}`}
          </h3>
        </div>
      )}
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
