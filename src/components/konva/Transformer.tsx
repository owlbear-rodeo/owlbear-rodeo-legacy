import Konva from "konva";
import { Transform } from "konva/lib/Util";
import { useEffect, useRef } from "react";
import { Transformer as KonvaTransformer } from "react-konva";

import { useGridCellPixelSize } from "../../contexts/GridContext";
import { useSetPreventMapInteraction } from "../../contexts/MapInteractionContext";
import { roundTo } from "../../helpers/shared";
import Vector2 from "../../helpers/Vector2";

type ResizerProps = {
  active: boolean;
  nodeRef: React.RefObject<Konva.Node>;
  onTransformStart?: (event: Konva.KonvaEventObject<Event>) => void;
  onTransformEnd?: (event: Konva.KonvaEventObject<Event>) => void;
};

function Transformer({
  active,
  nodeRef,
  onTransformStart,
  onTransformEnd,
}: ResizerProps) {
  const setPreventMapInteraction = useSetPreventMapInteraction();

  const gridCellPixelSize = useGridCellPixelSize();

  const transformerRef = useRef<Konva.Transformer>(null);
  useEffect(() => {
    if (active && transformerRef.current && nodeRef.current) {
      // we need to attach transformer manually
      transformerRef.current.nodes([nodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [active, nodeRef]);

  const movingAnchorRef = useRef<string>();
  function handleTransformStart(e: Konva.KonvaEventObject<Event>) {
    if (transformerRef.current) {
      movingAnchorRef.current = transformerRef.current._movingAnchorName;
      if (active) {
        setPreventMapInteraction(true);
      }
      onTransformStart && onTransformStart(e);
    }
  }

  function handleTransformEnd(e: Konva.KonvaEventObject<Event>) {
    if (active) {
      setPreventMapInteraction(false);
    }
    onTransformEnd && onTransformEnd(e);
  }

  if (!active) {
    return null;
  }

  return (
    <KonvaTransformer
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        let snapBox = { ...newBox };
        const movingAnchor = movingAnchorRef.current;
        if (movingAnchor === "middle-left" || movingAnchor === "middle-right") {
          const node = nodeRef.current;
          const stage = node?.getStage();
          const mapImage = stage?.findOne("#mapImage");
          if (!mapImage) {
            return oldBox;
          }

          // Get grid cell size in screen coordinates
          const mapTransform = mapImage.getAbsoluteTransform();
          const gridCellAbsoluteSize = Vector2.subtract(
            mapTransform.point(gridCellPixelSize),
            mapTransform.point({ x: 0, y: 0 })
          );

          // Account for grid snapping
          const nearestCellWidth = roundTo(
            snapBox.width,
            gridCellAbsoluteSize.x
          );
          const distanceToSnap = Math.abs(snapBox.width - nearestCellWidth);
          let snapping = false;
          if (distanceToSnap < gridCellAbsoluteSize.x * 0.1) {
            // TODO: use global grid snapping value
            snapBox.width = nearestCellWidth;
            snapping = true;
          }

          const deltaWidth = snapBox.width - oldBox.width;
          // Account for node ratio
          const inverseRatio =
            Math.round(oldBox.height) / Math.round(oldBox.width);
          const deltaHeight = inverseRatio * deltaWidth;

          // Account for node rotation
          // Create a transform to unrotate the x,y position of the Box
          const rotator = new Transform();
          rotator.rotate(-snapBox.rotation);

          // Unrotate and add the resize amount
          let rotatedMin = rotator.point({ x: snapBox.x, y: snapBox.y });
          rotatedMin.y = rotatedMin.y - deltaHeight / 2;
          // Snap x position if needed
          if (snapping) {
            const snapDelta = newBox.width - nearestCellWidth;
            rotatedMin.x = rotatedMin.x + snapDelta / 2;
          }

          // Rotated back
          rotator.invert();
          rotatedMin = rotator.point(rotatedMin);

          snapBox = {
            ...snapBox,
            height: snapBox.height + deltaHeight,
            x: rotatedMin.x,
            y: rotatedMin.y,
          };
        }

        if (snapBox.width < 5 || snapBox.height < 5) {
          return oldBox;
        }
        return snapBox;
      }}
      onTransformStart={handleTransformStart}
      onTransformEnd={handleTransformEnd}
      centeredScaling={true}
      rotationSnaps={[...Array(24).keys()].map((n) => n * 15)}
      rotateAnchorOffset={20}
      anchorCornerRadius={10}
      enabledAnchors={["middle-left", "middle-right"]}
      flipEnabled={false}
      ignoreStroke={true}
      borderStroke="transparent"
      anchorStroke="hsl(210, 50%, 96%"
      anchorFill="hsla(230, 25%, 15%, 80%)"
      anchorStrokeWidth={3}
      borderStrokeWidth={2}
      anchorSize={15}
      useSingleNodeRotation={true}
    />
  );
}

export default Transformer;
