import { useRef, useCallback, useEffect, useState } from "react";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Scene } from "@babylonjs/core";
import { Box } from "theme-ui";

// @ts-ignore
import environment from "../../dice/environment.dds";

import DiceInteraction from "./DiceInteraction";
import Dice from "../../dice/Dice";
import LoadingOverlay from "../LoadingOverlay";
import DiceButtons from "./DiceButtons";
import DiceResults from "./DiceResults";

import DiceTray from "../../dice/diceTray/DiceTray";

import { useDiceLoading } from "../../contexts/DiceLoadingContext";

import { getDiceRoll } from "../../helpers/dice";

import useSetting from "../../hooks/useSetting";

import { DefaultDice, DiceMesh, DiceRoll, DiceType } from "../../types/Dice";
import {
  DiceRollsChangeEventHandler,
  DiceShareChangeEventHandler,
} from "../../types/Events";

type DiceTrayOverlayProps = {
  isOpen: boolean;
  shareDice: boolean;
  onShareDiceChange: DiceShareChangeEventHandler;
  diceRolls: DiceRoll[];
  onDiceRollsChange: DiceRollsChangeEventHandler;
};

function DiceTrayOverlay({
  isOpen,
  shareDice,
  onShareDiceChange,
  diceRolls,
  onDiceRollsChange,
}: DiceTrayOverlayProps) {
  const sceneRef = useRef<Scene>();
  const shadowGeneratorRef = useRef<ShadowGenerator>();
  const diceRefs = useRef<DiceMesh[]>([]);
  const sceneVisibleRef = useRef(false);
  const sceneInteractionRef = useRef(false);
  // Add to the counter to ingore sleep values
  const sceneKeepAwakeRef = useRef(0);
  const diceTrayRef = useRef<DiceTray>();

  const [diceTraySize, setDiceTraySize] =
    useState<"single" | "double">("single");
  const { assetLoadStart, assetLoadFinish, isLoading } = useDiceLoading();
  const [fullScreen] = useSetting("map.fullScreen");

  function handleAssetLoadStart() {
    assetLoadStart();
  }

  function handleAssetLoadFinish() {
    assetLoadFinish();
    forceRender();
  }

  // Forces rendering for 1 second
  function forceRender(): () => void {
    // Force rerender
    sceneKeepAwakeRef.current++;
    let triggered = false;
    let timeout = setTimeout(() => {
      sceneKeepAwakeRef.current--;
      triggered = true;
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (!triggered) {
        sceneKeepAwakeRef.current--;
      }
    };
  }

  // Force render when changing dice tray size
  useEffect(() => {
    const diceTray = diceTrayRef.current;
    let cleanup;
    if (diceTray) {
      diceTray.size = diceTraySize;
      cleanup = forceRender();
    }
    return cleanup;
  }, [diceTraySize]);

  useEffect(() => {
    let cleanup;
    if (isOpen) {
      sceneVisibleRef.current = true;
      cleanup = forceRender();
    } else {
      sceneVisibleRef.current = false;
    }

    return cleanup;
  }, [isOpen]);

  const handleSceneMount = useCallback(async ({ scene, engine }) => {
    sceneRef.current = scene;
    await initializeScene(scene);
    engine.runRenderLoop(() => update(scene));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initializeScene(scene: Scene) {
    handleAssetLoadStart();
    let light = new DirectionalLight(
      "DirectionalLight",
      new Vector3(-0.5, -1, -0.5),
      scene
    );
    light.position = new Vector3(5, 10, 5);
    light.shadowMinZ = 1;
    light.shadowMaxZ = 50;
    let shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.useCloseExponentialShadowMap = true;
    shadowGenerator.darkness = 0.7;
    shadowGeneratorRef.current = shadowGenerator;

    scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(
      environment,
      scene
    );
    scene.environmentIntensity = 1.0;

    let diceTray = new DiceTray("single", scene, shadowGenerator);
    await diceTray.load();
    diceTrayRef.current = diceTray;
    handleAssetLoadFinish();
  }

  function update(scene: Scene) {
    function getDiceSpeed(dice: DiceMesh) {
      const diceSpeed =
        dice.instance.physicsImpostor?.getLinearVelocity()?.length() || 0;
      // If the dice is a d100 check the d10 as well
      if (dice.d10Instance) {
        const d10Speed =
          dice.d10Instance.physicsImpostor?.getLinearVelocity()?.length() || 0;
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
    const forceSceneRender = sceneKeepAwakeRef.current > 0;
    const sceneInteraction = sceneInteractionRef.current;
    const diceAwake = die.map((dice) => dice.asleep).includes(false);
    // Return early if scene doesn't need to be re-rendered
    if (!forceSceneRender && !sceneInteraction && !diceAwake) {
      return;
    }

    for (let i = 0; i < die.length; i++) {
      const dice = die[i];
      const speed = getDiceSpeed(dice);
      // If the speed has been below 0.01 for 1s set dice to sleep
      if (speed < 0.01 && !dice.sleepTimeout) {
        dice.sleepTimeout = setTimeout(() => {
          dice.asleep = true;
        }, 1000);
      } else if (speed > 0.5 && (dice.asleep || dice.sleepTimeout)) {
        dice.asleep = false;
        dice.sleepTimeout && clearTimeout(dice.sleepTimeout);
        dice.sleepTimeout = undefined;
      }
    }

    if (scene) {
      scene.render();
    }
  }

  function handleDiceAdd(style: typeof Dice, type: DiceType) {
    const scene = sceneRef.current;
    const shadowGenerator = shadowGeneratorRef.current;
    if (scene && shadowGenerator) {
      const instance = style.createInstance(type, scene);
      shadowGenerator.addShadowCaster(instance);
      style.roll(instance);
      let dice: DiceMesh = { type, instance, asleep: false };
      // If we have a d100 add a d10 as well
      if (type === "d100") {
        const d10Instance = style.createInstance("d10", scene);
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
      if (dice.d10Instance) {
        dice.d10Instance.dispose();
      }
    }
    diceRefs.current = [];
    forceRender();
  }

  function handleDiceReroll() {
    const die = diceRefs.current;
    for (let dice of die) {
      Dice.roll(dice.instance);
      if (dice.d10Instance) {
        Dice.roll(dice.d10Instance);
      }
      dice.asleep = false;
    }
  }

  async function handleDiceLoad(dice: DefaultDice) {
    handleAssetLoadStart();
    const scene = sceneRef.current;
    if (scene) {
      await dice.class.load(scene);
    }
    handleAssetLoadFinish();
  }

  const [traySize, setTraySize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    let renderTimeout: NodeJS.Timeout;
    let renderCleanup: () => void;
    function handleResize() {
      const map = document.querySelector(".map");
      if (!map) {
        return;
      }
      const mapRect = map.getBoundingClientRect();

      const availableWidth = mapRect.width - 108; // Subtract padding
      const availableHeight = mapRect.height - 80; // Subtract paddding and open icon

      let height = Math.min(availableHeight, 1000);
      let width = diceTraySize === "single" ? height / 2 : height;

      if (width > availableWidth) {
        width = availableWidth;
        height = diceTraySize === "single" ? width * 2 : width;
      }

      // Debounce a timeout to force re-rendering on resize
      renderTimeout = setTimeout(() => {
        renderCleanup = forceRender();
      }, 100);

      setTraySize({ width, height });
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (renderTimeout) {
        clearTimeout(renderTimeout);
      }
      if (renderCleanup) {
        renderCleanup();
      }
    };
  }, [diceTraySize, fullScreen, isOpen]);

  // Update dice rolls
  useEffect(() => {
    function updateDiceRolls() {
      const die = diceRefs.current;
      const sceneVisible = sceneVisibleRef.current;
      if (!sceneVisible) {
        return;
      }
      const diceAwake = die.map((dice) => dice.asleep).includes(false);
      if (!diceAwake) {
        return;
      }

      let newRolls: DiceRoll[] = [];
      for (let i = 0; i < die.length; i++) {
        const dice = die[i];
        let roll = getDiceRoll(dice);
        newRolls[i] = roll;
      }
      onDiceRollsChange(newRolls);
    }

    const updateInterval = setInterval(updateDiceRolls, 100);
    return () => {
      clearInterval(updateInterval);
    };
  }, [diceRefs, sceneVisibleRef, onDiceRollsChange]);

  return (
    <Box
      sx={{
        width: `${traySize.width}px`,
        height: `${traySize.height}px`,
        borderRadius: "4px",
        display: isOpen ? "block" : "none",
        position: "relative",
        overflow: "visible",
      }}
    >
      <Box
        sx={{
          transform: "translateX(50px)",
          width: "100%",
          height: "100%",
          pointerEvents: "all",
        }}
      >
        <DiceInteraction
          onSceneMount={handleSceneMount}
          onPointerDown={() => {
            sceneInteractionRef.current = true;
          }}
          onPointerUp={() => {
            sceneInteractionRef.current = false;
          }}
        />
        <DiceResults
          diceRolls={diceRolls}
          onDiceClear={() => {
            handleDiceClear();
            onDiceRollsChange([]);
          }}
          onDiceReroll={handleDiceReroll}
        />
      </Box>
      <DiceButtons
        diceRolls={diceRolls}
        onDiceAdd={(style, type) => {
          handleDiceAdd(style, type);
          onDiceRollsChange([...diceRolls, { type, roll: "unknown" }]);
        }}
        onDiceLoad={handleDiceLoad}
        onDiceTraySizeChange={setDiceTraySize}
        diceTraySize={diceTraySize}
        shareDice={shareDice}
        onShareDiceChange={onShareDiceChange}
        loading={isLoading}
      />
      {isLoading && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: "50px",
          }}
        >
          <LoadingOverlay />
        </Box>
      )}
    </Box>
  );
}

export default DiceTrayOverlay;
