import Konva from "konva";
import { Transform } from "konva/lib/Util";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  useGridCellPixelSize,
  useGridSnappingSensitivity,
} from "../../contexts/GridContext";
import { useSetPreventMapInteraction } from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";

import { roundTo } from "../../helpers/shared";
import Vector2 from "../../helpers/Vector2";
import { parseGridScale } from "../../helpers/grid";

import scaleDark from "../../images/ScaleDark.png";
import rotateDark from "../../images/RotateDark.png";

import { CustomTransformEventHandler } from "../../types/Events";

type TransformerProps = {
  active: boolean;
  nodes: Konva.Node[];
  attachments: Konva.Node[];
  onTransformStart?: CustomTransformEventHandler;
  onTransform?: CustomTransformEventHandler;
  onTransformEnd?: CustomTransformEventHandler;
  gridScale: string;
  portalSelector: string;
};

export class CustomTransformer extends Konva.Transformer {
  attachments: Konva.Node[] = [];

  // Override fitNodesInto applying transform to attachments as well
  _fitNodesInto(newAttrs: any, evt?: any) {
    var oldAttrs = this._getNodeRect();

    const minSize = 1;

    if (
      Konva.Util._inRange(
        newAttrs.width,
        -this.padding() * 2 - minSize,
        minSize
      )
    ) {
      this.update();
      return;
    }
    if (
      Konva.Util._inRange(
        newAttrs.height,
        -this.padding() * 2 - minSize,
        minSize
      )
    ) {
      this.update();
      return;
    }

    const allowNegativeScale = this.flipEnabled();
    var t = new Transform();
    t.rotate(this.rotation());
    if (
      this._movingAnchorName &&
      newAttrs.width < 0 &&
      this._movingAnchorName.indexOf("left") >= 0
    ) {
      const offset = t.point({
        x: -this.padding() * 2,
        y: 0,
      });
      newAttrs.x += offset.x;
      newAttrs.y += offset.y;
      newAttrs.width += this.padding() * 2;
      this._movingAnchorName = this._movingAnchorName.replace("left", "right");
      this._anchorDragOffset.x -= offset.x;
      this._anchorDragOffset.y -= offset.y;
      if (!allowNegativeScale) {
        this.update();
        return;
      }
    } else if (
      this._movingAnchorName &&
      newAttrs.width < 0 &&
      this._movingAnchorName.indexOf("right") >= 0
    ) {
      const offset = t.point({
        x: this.padding() * 2,
        y: 0,
      });
      this._movingAnchorName = this._movingAnchorName.replace("right", "left");
      this._anchorDragOffset.x -= offset.x;
      this._anchorDragOffset.y -= offset.y;
      newAttrs.width += this.padding() * 2;
      if (!allowNegativeScale) {
        this.update();
        return;
      }
    }
    if (
      this._movingAnchorName &&
      newAttrs.height < 0 &&
      this._movingAnchorName.indexOf("top") >= 0
    ) {
      const offset = t.point({
        x: 0,
        y: -this.padding() * 2,
      });
      newAttrs.x += offset.x;
      newAttrs.y += offset.y;
      this._movingAnchorName = this._movingAnchorName.replace("top", "bottom");
      this._anchorDragOffset.x -= offset.x;
      this._anchorDragOffset.y -= offset.y;
      newAttrs.height += this.padding() * 2;
      if (!allowNegativeScale) {
        this.update();
        return;
      }
    } else if (
      this._movingAnchorName &&
      newAttrs.height < 0 &&
      this._movingAnchorName.indexOf("bottom") >= 0
    ) {
      const offset = t.point({
        x: 0,
        y: this.padding() * 2,
      });
      this._movingAnchorName = this._movingAnchorName.replace("bottom", "top");
      this._anchorDragOffset.x -= offset.x;
      this._anchorDragOffset.y -= offset.y;
      newAttrs.height += this.padding() * 2;
      if (!allowNegativeScale) {
        this.update();
        return;
      }
    }

    if (this.boundBoxFunc()) {
      const bounded = this.boundBoxFunc()(oldAttrs, newAttrs);
      if (bounded) {
        newAttrs = bounded;
      } else {
        Konva.Util.warn(
          "boundBoxFunc returned falsy. You should return new bound rect from it!"
        );
      }
    }

    // base size value doesn't really matter
    // we just need to think about bounding boxes as transforms
    // but how?
    // the idea is that we have a transformed rectangle with the size of "baseSize"
    const baseSize = 10000000;
    const oldTr = new Transform();
    oldTr.translate(oldAttrs.x, oldAttrs.y);
    oldTr.rotate(oldAttrs.rotation);
    oldTr.scale(oldAttrs.width / baseSize, oldAttrs.height / baseSize);

    const newTr = new Transform();
    newTr.translate(newAttrs.x, newAttrs.y);
    newTr.rotate(newAttrs.rotation);
    newTr.scale(newAttrs.width / baseSize, newAttrs.height / baseSize);

    // now lets think we had [old transform] and n ow we have [new transform]
    // Now, the questions is: how can we transform "parent" to go from [old transform] into [new transform]
    // in equation it will be:
    // [delta transform] * [old transform] = [new transform]
    // that means that
    // [delta transform] = [new transform] * [old transform inverted]
    const delta = newTr.multiply(oldTr.invert());

    [...this._nodes, ...this.attachments].forEach((node) => {
      // for each node we have the same [delta transform]
      // the equations is
      // [delta transform] * [parent transform] * [old local transform] = [parent transform] * [new local transform]
      // and we need to find [new local transform]
      // [new local] = [parent inverted] * [delta] * [parent] * [old local]
      const parentTransform = node.getParent().getAbsoluteTransform();
      const localTransform = node.getTransform().copy();
      // skip offset:
      localTransform.translate(node.offsetX(), node.offsetY());

      const newLocalTransform = new Transform();
      newLocalTransform
        .multiply(parentTransform.copy().invert())
        .multiply(delta)
        .multiply(parentTransform)
        .multiply(localTransform);

      const attrs = newLocalTransform.decompose();
      node.setAttrs(attrs);
      this._fire("transform", { evt: evt, target: node });
      node._fire("transform", { evt: evt, target: node });
      node.getLayer()?.batchDraw();
    });
    this.rotation(Konva.Util._getRotation(newAttrs.rotation));
    this._resetTransformCache();
    this.update();
    this.getLayer()?.batchDraw();
  }
}

function Transformer({
  active,
  nodes,
  attachments,
  onTransformStart,
  onTransform,
  onTransformEnd,
  gridScale,
  portalSelector,
}: TransformerProps) {
  const setPreventMapInteraction = useSetPreventMapInteraction();

  const gridCellPixelSize = useGridCellPixelSize();
  const gridCellAbsoluteSizeRef = useRef({
    x: 0,
    y: 0,
  });
  const scale = parseGridScale(gridScale);

  const snappingSensitivity = useGridSnappingSensitivity();
  // Clamp snapping to 0 to accound for -1 snapping override
  const gridSnappingSensitivity = useMemo(
    () => Math.max(snappingSensitivity, 0),
    [snappingSensitivity]
  );

  const mapStageRef = useMapStage();
  const transformerRef = useRef<CustomTransformer | null>(null);

  useEffect(() => {
    let transformer = transformerRef.current;
    const stage = mapStageRef.current;
    if (active && stage && !transformer) {
      transformer = new CustomTransformer({
        centeredScaling: true,
        rotateAnchorOffset: 16,
        enabledAnchors: ["middle-left", "middle-right"],
        flipEnabled: false,
        ignoreStroke: true,
        borderStroke: "invisible",
        anchorStroke: "invisible",
        anchorCornerRadius: 24,
        borderStrokeWidth: 0,
        anchorSize: 48,
      });
      const portal = stage.findOne<Konva.Group>(portalSelector);
      if (portal) {
        portal.add(transformer);
        transformerRef.current = transformer;
      }
    }

    return () => {
      if (stage && transformer) {
        transformer.destroy();
        transformerRef.current = null;
      }
    };
  }, [mapStageRef, portalSelector, active]);

  useEffect(() => {
    transformerRef.current?.boundBoxFunc((oldBox, newBox) => {
      let snapBox = { ...newBox };
      const movingAnchor = movingAnchorRef.current;
      if (movingAnchor === "middle-left" || movingAnchor === "middle-right") {
        // Account for grid snapping
        const nearestCellWidth = roundTo(
          snapBox.width,
          gridCellAbsoluteSizeRef.current.x
        );
        const distanceToSnap = Math.abs(snapBox.width - nearestCellWidth);
        let snapping = false;
        if (
          distanceToSnap <
          gridCellAbsoluteSizeRef.current.x * gridSnappingSensitivity
        ) {
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
    });
  });

  useEffect(() => {
    transformerRef.current?.rotationSnaps(
      snappingSensitivity === -1
        ? [] // Disabled rotation snapping if grid snapping disabled with shortcut
        : [...Array(24).keys()].map((n) => n * 15)
    );
  });

  const movingAnchorRef = useRef<string>();
  const transformTextRef = useRef<Konva.Group>();

  useEffect(() => {
    function updateGridCellAbsoluteSize() {
      if (active) {
        const transformer = transformerRef.current;
        const stage = transformer?.getStage();
        const mapImage = stage?.findOne("#mapImage");
        if (!mapImage) {
          return;
        }

        // Use min side for hex grids
        const minSize = Vector2.componentMin(gridCellPixelSize);
        const size = new Vector2(minSize, minSize);

        // Get grid cell size in screen coordinates
        const mapTransform = mapImage.getAbsoluteTransform();
        const absoluteSize = Vector2.subtract(
          mapTransform.point(size),
          mapTransform.point({ x: 0, y: 0 })
        );

        gridCellAbsoluteSizeRef.current = absoluteSize;
      }
    }

    function handleTransformStart(e: Konva.KonvaEventObject<Event>) {
      const transformer = transformerRef.current;
      if (transformer) {
        movingAnchorRef.current = transformer._movingAnchorName;
        setPreventMapInteraction(true);

        const transformText = new Konva.Label();
        const stageScale = transformer.getStage()?.scale() || { x: 1, y: 1 };
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

        transformer.getLayer()?.add(transformText);
        transformTextRef.current = transformText;

        updateGridCellAbsoluteSize();
        updateTransformText();

        onTransformStart && onTransformStart(e, attachments);
      }
    }

    function updateTransformText() {
      const movingAnchor = movingAnchorRef.current;
      const transformText = transformTextRef.current;
      const transformer = transformerRef.current;
      const node = transformer?.nodes()[0];
      if (node && transformText && transformer) {
        const text = transformText.getChildren()[1] as Konva.Text;
        if (movingAnchor === "rotater") {
          text.text(`${node.rotation().toFixed(0)}°`);
        } else {
          const nodeRect = node.getClientRect({ skipShadow: true });
          const nodeScale = Vector2.divide(
            { x: nodeRect.width, y: nodeRect.height },
            gridCellAbsoluteSizeRef.current
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

    function handleTransform(e: Konva.KonvaEventObject<Event>) {
      updateTransformText();
      onTransform?.(e, attachments);
    }

    function handleTransformEnd(e: Konva.KonvaEventObject<Event>) {
      setPreventMapInteraction(false);
      transformTextRef.current?.destroy();
      transformTextRef.current = undefined;
      onTransformEnd && onTransformEnd(e, attachments);
    }

    transformerRef.current?.on("transformstart", handleTransformStart);
    transformerRef.current?.on("transform", handleTransform);
    transformerRef.current?.on("transformend", handleTransformEnd);

    return () => {
      transformerRef.current?.off("transformstart", handleTransformStart);
      transformerRef.current?.off("transform", handleTransform);
      transformerRef.current?.off("transformend", handleTransformEnd);
    };
  });

  const [anchorScale, anchorScaleStatus] = useAnchorImage(96, scaleDark);
  const [anchorRotate, anchorRotateStatus] = useAnchorImage(96, rotateDark);

  // Add nodes to transformer and setup
  useEffect(() => {
    const transformer = transformerRef.current;
    if (
      active &&
      transformer &&
      anchorScaleStatus === "loaded" &&
      anchorRotateStatus === "loaded"
    ) {
      transformer.setNodes(nodes);
      transformer.attachments = attachments;

      const middleLeft = transformer.findOne<Konva.Rect>(".middle-left");
      const middleRight = transformer.findOne<Konva.Rect>(".middle-right");
      const rotater = transformer.findOne<Konva.Rect>(".rotater");

      middleLeft.fillPriority("pattern");
      middleLeft.fillPatternImage(anchorScale);
      middleLeft.strokeEnabled(false);
      middleLeft.fillPatternScaleX(-0.5);
      middleLeft.fillPatternScaleY(0.5);

      middleRight.fillPriority("pattern");
      middleRight.fillPatternImage(anchorScale);
      middleRight.strokeEnabled(false);
      middleRight.fillPatternScaleX(0.5);
      middleRight.fillPatternScaleY(0.5);

      rotater.fillPriority("pattern");
      rotater.fillPatternImage(anchorRotate);
      rotater.strokeEnabled(false);
      rotater.fillPatternScaleX(0.5);
      rotater.fillPatternScaleY(0.5);

      transformer.getLayer()?.batchDraw();
    }
  }, [
    active,
    nodes,
    attachments,
    anchorScale,
    anchorRotate,
    anchorScaleStatus,
    anchorRotateStatus,
  ]);

  return null;
}

Transformer.defaultProps = {
  portalSelector: "#portal",
  attachments: [],
};

type AnchorImageStatus = "loading" | "loaded" | "failed";

function useAnchorImage(
  size: number,
  source: string
): [HTMLCanvasElement, AnchorImageStatus] {
  const [canvas] = useState(document.createElement("canvas"));
  const [status, setStatus] = useState<AnchorImageStatus>("loading");

  useEffect(() => {
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
      setStatus("loaded");
    };
    image.onerror = () => {
      setStatus("failed");
    };
  }, [canvas, size, source]);

  return [canvas, status];
}

export default Transformer;
