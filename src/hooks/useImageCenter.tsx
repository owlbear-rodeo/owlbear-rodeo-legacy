import { useEffect, useRef } from "react";

type useImageCenterProps = {
  data: 
  stageRef: 
  stageWidth: number;
  stageHeight: number;
  stageTranslateRef:
  setStageScale:
  imageLayerRef:
  containerRef: 
  responsive?: boolean
}

function useImageCenter(
  data,
  stageRef,
  stageWidth,
  stageHeight,
  stageTranslateRef,
  setStageScale,
  imageLayerRef,
  containerRef,
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
  const previousDataIdRef = useRef();
  const previousStageRatioRef = useRef(stageRatio);
  useEffect(() => {
    if (!data) {
      return;
    }

    const layer = imageLayerRef.current;
    const containerRect = containerRef.current.getBoundingClientRect();
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
      stageRef.current.position({ x: 0, y: 0 });
      stageTranslateRef.current = { x: 0, y: 0 };

      setStageScale(1);
    }
    previousDataIdRef.current = data.id;
    previousStageRatioRef.current = stageRatio;
  });

  return [imageWidth, imageHeight];
}

export default useImageCenter;
