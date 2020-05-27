import React, {
  useRef,
  useCallback,
  useEffect,
  useContext,
  useState,
} from "react";
import * as BABYLON from "babylonjs";
import { Box } from "theme-ui";

import environment from "../../../dice/environment.dds";

import Scene from "./DiceScene";
import DiceControls from "./DiceControls";
import Dice from "../../../dice/Dice";
import LoadingOverlay from "../../LoadingOverlay";

import DiceTray from "../../../dice/diceTray/DiceTray";

import MapInteractionContext from "../../../contexts/MapInteractionContext";
import DiceLoadingContext from "../../../contexts/DiceLoadingContext";

function DiceTrayOverlay({ isOpen }) {
  const sceneRef = useRef();
  const shadowGeneratorRef = useRef();
  const diceRefs = useRef([]);
  const sceneVisibleRef = useRef(false);
  const sceneInteractionRef = useRef(false);
  // Set to true to ignore scene sleep and visible values
  const forceSceneRenderRef = useRef(false);
  const diceTrayRef = useRef();

  const [diceTraySize, setDiceTraySize] = useState("single");
  const { assetLoadStart, assetLoadFinish, isLoading } = useContext(
    DiceLoadingContext
  );

  useEffect(() => {
    const diceTray = diceTrayRef.current;
    let resizeTimout;
    if (diceTray) {
      diceTray.size = diceTraySize;
      // Force rerender
      forceSceneRenderRef.current = true;
      resizeTimout = setTimeout(() => {
        forceSceneRenderRef.current = false;
      }, 1000);
    }
    return () => {
      if (resizeTimout) {
        clearTimeout(resizeTimout);
      }
    };
  }, [diceTraySize]);

  useEffect(() => {
    let openTimeout;
    if (isOpen) {
      sceneVisibleRef.current = true;
      // Force scene rendering on open for 1s to ensure dice tray is rendered
      forceSceneRenderRef.current = true;
      openTimeout = setTimeout(() => {
        forceSceneRenderRef.current = false;
      }, 1000);
    } else {
      sceneVisibleRef.current = false;
    }
    return () => {
      if (openTimeout) {
        clearTimeout(openTimeout);
      }
    };
  }, [isOpen]);

  const handleSceneMount = useCallback(({ scene, engine }) => {
    sceneRef.current = scene;
    initializeScene(scene);
    engine.runRenderLoop(() => update(scene));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initializeScene(scene) {
    assetLoadStart();
    let light = new BABYLON.DirectionalLight(
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

    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
      environment,
      scene
    );
    scene.environmentIntensity = 1.0;

    let diceTray = new DiceTray("single", scene, shadowGenerator);
    await diceTray.load();
    diceTrayRef.current = diceTray;
    assetLoadFinish();
  }

  function update(scene) {
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

    const die = diceRefs.current;
    const sceneVisible = sceneVisibleRef.current;
    if (!sceneVisible) {
      return;
    }
    const sceneInteraction = sceneInteractionRef.current;
    const forceSceneRender = forceSceneRenderRef.current;
    const diceAwake = die.map((dice) => dice.asleep).includes(false);
    // Return early if scene doesn't need to be re-rendered
    if (!forceSceneRender && !sceneInteraction && !diceAwake) {
      return;
    }

    for (let i = 0; i < die.length; i++) {
      const dice = die[i];
      const speed = getDiceSpeed(dice);
      // If the speed has been below 0.01 for 1s set dice to sleep
      if (speed < 0.01 && !dice.sleepTimout) {
        dice.sleepTimout = setTimeout(() => {
          dice.asleep = true;
        }, 1000);
      } else if (speed > 0.5 && (dice.asleep || dice.sleepTimout)) {
        dice.asleep = false;
        clearTimeout(dice.sleepTimout);
        dice.sleepTimout = null;
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
      Dice.roll(instance);
      let dice = { type, instance, asleep: false };
      // If we have a d100 add a d10 as well
      if (type === "d100") {
        const d10Instance = await style.createInstance("d10", scene);
        shadowGenerator.addShadowCaster(d10Instance);
        Dice.roll(d10Instance);
        dice.d10Instance = d10Instance;
      }
      diceRefs.current.push(dice);
    }
  }

  function handleDiceClear() {
    const die = diceRefs.current;
    for (let dice of die) {
      dice.instance.dispose();
      if (dice.type === "d100") {
        dice.d10Instance.dispose();
      }
    }
    diceRefs.current = [];
    // Force scene rendering to show cleared dice
    forceSceneRenderRef.current = true;
    setTimeout(() => {
      if (forceSceneRenderRef) {
        forceSceneRenderRef.current = false;
      }
    }, 100);
  }

  function handleDiceReroll() {
    const die = diceRefs.current;
    for (let dice of die) {
      Dice.roll(dice.instance);
      if (dice.type === "d100") {
        Dice.roll(dice.d10Instance);
      }
      dice.asleep = false;
    }
  }

  async function handleDiceLoad(dice) {
    assetLoadStart();
    const scene = sceneRef.current;
    if (scene) {
      await dice.class.load(scene);
    }
    assetLoadFinish();
  }

  const { setPreventMapInteraction } = useContext(MapInteractionContext);

  return (
    <Box
      sx={{
        width: diceTraySize === "single" ? "500px" : "1000px",
        maxWidth:
          diceTraySize === "single"
            ? "calc(50vh - 48px)"
            : "calc(100vh - 48px)",
        paddingBottom: diceTraySize === "single" ? "200%" : "100%",
        borderRadius: "4px",
        display: isOpen ? "block" : "none",
        position: "relative",
        overflow: "hidden",
      }}
      bg="background"
    >
      <Scene
        onSceneMount={handleSceneMount}
        onPointerDown={() => {
          sceneInteractionRef.current = true;
          setPreventMapInteraction(true);
        }}
        onPointerUp={() => {
          sceneInteractionRef.current = false;
          setPreventMapInteraction(false);
        }}
      />
      <DiceControls
        diceRefs={diceRefs}
        sceneVisibleRef={sceneVisibleRef}
        onDiceAdd={handleDiceAdd}
        onDiceClear={handleDiceClear}
        onDiceReroll={handleDiceReroll}
        onDiceLoad={handleDiceLoad}
        diceTraySize={diceTraySize}
        onDiceTraySizeChange={setDiceTraySize}
      />
      {isLoading && <LoadingOverlay />}
    </Box>
  );
}

export default DiceTrayOverlay;
