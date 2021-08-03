import Konva from "konva";
import { Transform } from "konva/lib/Util";
import { useEffect, useMemo, useRef } from "react";
import { Transformer as KonvaTransformer } from "react-konva";

import { useGridCellPixelSize } from "../../contexts/GridContext";
import { useSetPreventMapInteraction } from "../../contexts/MapInteractionContext";
import { roundTo } from "../../helpers/shared";
import Vector2 from "../../helpers/Vector2";

import scaleDark from "../../images/ScaleDark.png";
import rotateDark from "../../images/RotateDark.png";
import { parseGridScale } from "../../helpers/grid";

type ResizerProps = {
  active: boolean;
  nodeRef: React.RefObject<Konva.Node>;
  onTransformStart?: (event: Konva.KonvaEventObject<Event>) => void;
  onTransformEnd?: (event: Konva.KonvaEventObject<Event>) => void;
  gridScale: string;
};

function Transformer({
  active,
  nodeRef,
  onTransformStart,
  onTransformEnd,
  gridScale,
}: ResizerProps) {
  const setPreventMapInteraction = useSetPreventMapInteraction();

  const gridCellPixelSize = useGridCellPixelSize();
  const gridCellAbsoluteSize = useMemo(() => {
    if (active) {
      const node = nodeRef.current;
      const stage = node?.getStage();
      const mapImage = stage?.findOne("#mapImage");
      if (!mapImage) {
        return { x: 0, y: 0 };
      }

      // Use min side for hex grids
      const minSize = Vector2.componentMin(gridCellPixelSize);
      const size = new Vector2(minSize, minSize);

      // Get grid cell size in screen coordinates
      const mapTransform = mapImage.getAbsoluteTransform();
      const gridCellAbsoluteSize = Vector2.subtract(
        mapTransform.point(size),
        mapTransform.point({ x: 0, y: 0 })
      );
      return gridCellAbsoluteSize;
    } else {
      return { x: 0, y: 0 };
    }
  }, [active, nodeRef, gridCellPixelSize]);
  const scale = parseGridScale(gridScale);

  const anchorScale = useMemo(() => getAnchorImage(192, scaleDark), []);
  const anchorRotate = useMemo(() => getAnchorImage(192, rotateDark), []);

  const transformerRef = useRef<Konva.Transformer>(null);
  useEffect(() => {
    if (active && transformerRef.current && nodeRef.current) {
      // we need to attach transformer manually
      transformerRef.current.nodes([nodeRef.current]);

      const middleLeft =
        transformerRef.current.findOne<Konva.Rect>(".middle-left");
      const middleRight =
        transformerRef.current.findOne<Konva.Rect>(".middle-right");
      const rotater = transformerRef.current.findOne<Konva.Rect>(".rotater");

      middleLeft.fillPriority("pattern");
      middleLeft.fillPatternImage(anchorScale);
      middleLeft.strokeEnabled(false);
      middleLeft.fillPatternScaleX(-0.25);
      middleLeft.fillPatternScaleY(0.25);

      middleRight.fillPriority("pattern");
      middleRight.fillPatternImage(anchorScale);
      middleRight.strokeEnabled(false);
      middleRight.fillPatternScaleX(0.25);
      middleRight.fillPatternScaleY(0.25);

      rotater.fillPriority("pattern");
      rotater.fillPatternImage(anchorRotate);
      rotater.strokeEnabled(false);
      rotater.fillPatternScaleX(0.25);
      rotater.fillPatternScaleY(0.25);

      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [active, nodeRef, anchorScale, anchorRotate]);

  const movingAnchorRef = useRef<string>();
  const transformTextRef = useRef<Konva.Group>();
  function handleTransformStart(e: Konva.KonvaEventObject<Event>) {
    const transformer = transformerRef.current;
    const node = nodeRef.current;
    if (transformer && node) {
      movingAnchorRef.current = transformer._movingAnchorName;
      setPreventMapInteraction(true);

      const transformText = new Konva.Label();
      const stageScale = node.getStage()?.scale() || { x: 1, y: 1 };
      transformText.scale(Vector2.divide({ x: 1, y: 1 }, stageScale));

      const tag = new Konva.Tag();
      tag.fill("hsla(230, 25%, 15%, 0.8)");
      tag.cornerRadius(4);
      // @ts-ignore
      tag.pointerDirection("down");
      tag.pointerHeight(4);
      tag.pointerWidth(4);

      const text = new Konva.Text();
      text.fontSize(16);
      text.padding(4);
      text.fill("white");

      transformText.add(tag);
      transformText.add(text);

      node.getLayer()?.add(transformText);
      transformTextRef.current = transformText;

      updateTransformText();

      onTransformStart && onTransformStart(e);
    }
  }

  function updateTransformText() {
    const node = nodeRef.current;
    const movingAnchor = movingAnchorRef.current;
    const transformText = transformTextRef.current;
    const transformer = transformerRef.current;
    if (node && transformText && transformer) {
      const text = transformText.getChildren()[1] as Konva.Text;
      if (movingAnchor === "rotater") {
        text.text(`${node.rotation().toFixed(0)}°`);
      } else {
        const nodeRect = node.getClientRect();
        const nodeScale = Vector2.divide(
          { x: nodeRect.width, y: nodeRect.height },
          gridCellAbsoluteSize
        );
        text.text(
          `${(nodeScale.x * scale.multiplier).toFixed(scale.digits)}${
            scale.unit
          }`
        );
      }

      const nodePosition = node.getStage()?.getPointerPosition();
      if (nodePosition) {
        transformText.absolutePosition({
          x: nodePosition.x,
          y: nodePosition.y,
        });
      }
    }
  }

  function handleTrasform() {
    updateTransformText();
  }

  function handleTransformEnd(e: Konva.KonvaEventObject<Event>) {
    setPreventMapInteraction(false);
    transformTextRef.current?.destroy();
    transformTextRef.current = undefined;
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
      onTransform={handleTrasform}
      onTransformEnd={handleTransformEnd}
      centeredScaling={true}
      rotationSnaps={[...Array(24).keys()].map((n) => n * 15)}
      rotateAnchorOffset={16}
      enabledAnchors={["middle-left", "middle-right"]}
      flipEnabled={false}
      ignoreStroke={true}
      borderStroke="invisible"
      anchorStroke="invisible"
      anchorCornerRadius={24}
      borderStrokeWidth={0}
      anchorSize={48}
      useSingleNodeRotation={true}
    />
  );
}

function getAnchorImage(size: number, source: string) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = new Image();
  image.src = source;
  image.onload = () => {
    const imageRatio = image.width / image.height;
    const imageWidth = canvas.height * imageRatio;
    ctx?.drawImage(
      image,
      canvas.width / 2 - imageWidth / 2,
      0,
      imageWidth,
      canvas.height
    );
  };
  return canvas;
}

export default Transformer;
