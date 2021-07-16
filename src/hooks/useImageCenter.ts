import { Layer } from "konva/types/Layer";
import { useEffect, useRef } from "react";

import { MapStage } from "../contexts/MapStageContext";
import Vector2 from "../helpers/Vector2";

type ImageData = {
  id: string;
  width: number;
  height: number;
};

function useImageCenter(
  data: ImageData,
  stageRef: MapStage,
  stageWidth: number,
  stageHeight: number,
  stageTranslateRef: React.MutableRefObject<Vector2>,
  setStageScale: React.Dispatch<React.SetStateAction<number>>,
  imageLayerRef: React.RefObject<Layer>,
  containerRef: React.RefObject<HTMLDivElement>,
  responsive = false
) {
  const stageRatio = stageWidth / stageHeight;
  const imageRatio = data ? data.width / data.height : 1;

  let imageWidth: number;
  let imageHeight: number;
  if (stageRatio > imageRatio) {
    imageWidth = data ? stageHeight / (data.height / data.width) : stageWidth;
    imageHeight = stageHeight;
  } else {
    imageWidth = stageWidth;
    imageHeight = data ? stageWidth * (data.height / data.width) : stageHeight;
  }

  // Reset image translate and stage scale
  const previousDataIdRef = useRef<string>();
  const previousStageRatioRef = useRef(stageRatio);
  useEffect(() => {
    if (!data) {
      return;
    }

    const layer = imageLayerRef.current;
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const previousDataId = previousDataIdRef.current;
    const previousStageRatio = previousStageRatioRef.current;

    // Update when the id has changed and if responsive update when the stage changes
    const shouldUpdate = responsive
      ? previousDataId !== data.id || previousStageRatio !== stageRatio
      : previousDataId !== data.id;

    if (layer && shouldUpdate) {
      let newTranslate;
      if (stageRatio > imageRatio) {
        newTranslate = {
          x: -(imageWidth - containerRect.width) / 2,
          y: 0,
        };
      } else {
        newTranslate = {
          x: 0,
          y: -(imageHeight - containerRect.height) / 2,
        };
      }
      layer.position(newTranslate);
      stage.position({ x: 0, y: 0 });
      stageTranslateRef.current = { x: 0, y: 0 };

      setStageScale(1);
    }
    previousDataIdRef.current = data.id;
    previousStageRatioRef.current = stageRatio;
  });

  return [imageWidth, imageHeight];
}

export default useImageCenter;
