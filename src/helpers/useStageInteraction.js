import { useRef } from "react";
import { useGesture } from "react-use-gesture";
import normalizeWheel from "normalize-wheel";

const wheelZoomSpeed = -1;
const touchZoomSpeed = 0.005;
const minZoom = 0.1;

function useStageInteraction(
  stage,
  stageScale,
  onStageScaleChange,
  stageTranslateRef,
  layer,
  maxZoom = 10,
  tool = "pan",
  preventInteraction = false,
  gesture = {}
) {
  const isInteractingWithCanvas = useRef(false);
  const pinchPreviousDistanceRef = useRef();
  const pinchPreviousOriginRef = useRef();

  const bind = useGesture({
    ...gesture,
    onWheelStart: (props) => {
      const { event } = props;
      isInteractingWithCanvas.current =
        event.target === layer.getCanvas()._canvas;
      gesture.onWheelStart && gesture.onWheelStart(props);
    },
    onWheel: (props) => {
      const { event } = props;
      event.persist();
      const { pixelY } = normalizeWheel(event);
      if (preventInteraction || !isInteractingWithCanvas.current) {
        return;
      }
      const newScale = Math.min(
        Math.max(
          stageScale +
            (pixelY * wheelZoomSpeed * stageScale) / window.innerHeight,
          minZoom
        ),
        maxZoom
      );

      const pointer = stage.getPointerPosition();
      const pointerChange = {
        x: (pointer.x - stage.x()) / stageScale,
        y: (pointer.y - stage.y()) / stageScale,
      };

      const newTranslate = {
        x: pointer.x - pointerChange.x * newScale,
        y: pointer.y - pointerChange.y * newScale,
      };
      stage.position(newTranslate);
      stageTranslateRef.current = newTranslate;

      onStageScaleChange(newScale);
      gesture.onWheel && gesture.onWheel(props);
    },
    onPinch: (props) => {
      const { da, origin, first } = props;
      const [distance] = da;
      const [originX, originY] = origin;
      if (first) {
        pinchPreviousDistanceRef.current = distance;
        pinchPreviousOriginRef.current = { x: originX, y: originY };
      }

      // Apply scale
      const distanceDelta = distance - pinchPreviousDistanceRef.current;
      const originXDelta = originX - pinchPreviousOriginRef.current.x;
      const originYDelta = originY - pinchPreviousOriginRef.current.y;
      const newScale = Math.min(
        Math.max(stageScale + distanceDelta * touchZoomSpeed, minZoom),
        maxZoom
      );
      onStageScaleChange(newScale);

      // Apply translate
      const stageTranslate = stageTranslateRef.current;
      const newTranslate = {
        x: stageTranslate.x + originXDelta,
        y: stageTranslate.y + originYDelta,
      };
      stage.position(newTranslate);
      stage.draw();
      stageTranslateRef.current = newTranslate;

      pinchPreviousDistanceRef.current = distance;
      pinchPreviousOriginRef.current = { x: originX, y: originY };
      gesture.onPinch && gesture.onPinch(props);
    },
    onDragStart: (props) => {
      const { event } = props;
      isInteractingWithCanvas.current =
        event.target === layer.getCanvas()._canvas;
      gesture.onDragStart && gesture.onDragStart(props);
    },
    onDrag: (props) => {
      const { delta, pinching } = props;
      if (preventInteraction || pinching || !isInteractingWithCanvas.current) {
        return;
      }

      const [dx, dy] = delta;
      const stageTranslate = stageTranslateRef.current;
      if (tool === "pan") {
        const newTranslate = {
          x: stageTranslate.x + dx,
          y: stageTranslate.y + dy,
        };
        stage.position(newTranslate);
        stage.draw();
        stageTranslateRef.current = newTranslate;
      }
      gesture.onDrag && gesture.onDrag(props);
    },
  });

  return bind;
}

export default useStageInteraction;
