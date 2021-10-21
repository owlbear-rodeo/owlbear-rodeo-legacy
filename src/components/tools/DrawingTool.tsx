import { useState, useEffect } from "react";
import shortid from "shortid";
import { Group } from "react-konva";

import {
  useDebouncedStageScale,
  useMapWidth,
  useMapHeight,
  useInteractionEmitter,
  leftMouseButton,
  MapDragEvent,
} from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import {
  useGridCellNormalizedSize,
  useGridStrokeWidth,
} from "../../contexts/GridContext";

import Vector2 from "../../helpers/Vector2";
import {
  getDefaultShapeData,
  getUpdatedShapeData,
  simplifyPoints,
} from "../../helpers/drawing";
import { getRelativePointerPosition } from "../../helpers/konva";

import useGridSnapping from "../../hooks/useGridSnapping";

import DrawingShape from "../konva/Drawing";

import { Map } from "../../types/Map";
import {
  Drawing,
  DrawingToolSettings,
  drawingToolIsShape,
  Shape,
} from "../../types/Drawing";

export type DrawingAddEventHanlder = (drawing: Drawing) => void;
export type DrawingsRemoveEventHandler = (drawingIds: string[]) => void;

type MapDrawingProps = {
  map: Map | null;
  drawings: Drawing[];
  onDrawingAdd: DrawingAddEventHanlder;
  onDrawingsRemove: DrawingsRemoveEventHandler;
  active: boolean;
  toolSettings: DrawingToolSettings;
};

function DrawingTool({
  map,
  drawings,
  onDrawingAdd: onShapeAdd,
  onDrawingsRemove: onShapesRemove,
  active,
  toolSettings,
}: MapDrawingProps) {
  const stageScale = useDebouncedStageScale();
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const interactionEmitter = useInteractionEmitter();

  const gridCellNormalizedSize = useGridCellNormalizedSize();
  const gridStrokeWidth = useGridStrokeWidth();

  const mapStageRef = useMapStage();
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [erasingDrawings, setErasingDrawings] = useState<Drawing[]>([]);

  const shouldHover = toolSettings.type === "erase" && active;

  const isBrush =
    toolSettings.type === "brush" || toolSettings.type === "paint";
  const isShape =
    toolSettings.type === "line" ||
    toolSettings.type === "rectangle" ||
    toolSettings.type === "circle" ||
    toolSettings.type === "triangle";

  const snapPositionToGrid = useGridSnapping();

  useEffect(() => {
    if (!active) {
      return;
    }
    const mapStage = mapStageRef.current;

    function getBrushPosition() {
      if (!mapStage || !map) {
        return;
      }
      const mapImage = mapStage.findOne("#mapImage");
      let position = getRelativePointerPosition(mapImage);
      if (!position) {
        return;
      }
      if (map.snapToGrid && isShape) {
        position = snapPositionToGrid(position);
      }
      return Vector2.divide(position, {
        x: mapImage.width(),
        y: mapImage.height(),
      });
    }

    function handleBrushDown(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      const brushPosition = getBrushPosition();
      if (!brushPosition) {
        return;
      }
      const commonShapeData = {
        color: toolSettings.color,
        blend: toolSettings.useBlending,
        id: shortid.generate(),
      };
      const type = toolSettings.type;
      if (isBrush) {
        setDrawing({
          type: "path",
          pathType: type === "brush" ? "stroke" : "fill",
          data: { points: [brushPosition] },
          strokeWidth: type === "brush" ? 1 : 0,
          ...commonShapeData,
        });
      } else if (isShape && drawingToolIsShape(type)) {
        setDrawing({
          type: "shape",
          shapeType: type,
          data: getDefaultShapeData(type, brushPosition),
          strokeWidth:
            toolSettings.type === "line" || !toolSettings.useShapeFill ? 1 : 0,
          ...commonShapeData,
        } as Shape);
      }
      setIsBrushDown(true);
    }

    function handleBrushMove(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      const brushPosition = getBrushPosition();
      if (!brushPosition) {
        return;
      }
      if (isBrushDown && drawing) {
        if (isBrush) {
          setDrawing((prevShape) => {
            if (prevShape?.type !== "path") {
              return prevShape;
            }
            const prevPoints = prevShape.data.points;
            if (
              Vector2.compare(
                prevPoints[prevPoints.length - 1],
                brushPosition,
                0.001
              )
            ) {
              return prevShape;
            }
            const simplified = simplifyPoints(
              [...prevPoints, brushPosition],
              1 / 1000 / stageScale
            );
            return {
              ...prevShape,
              data: { points: simplified },
            };
          });
        } else if (isShape) {
          setDrawing((prevShape) => {
            if (prevShape?.type !== "shape") {
              return prevShape;
            }
            return {
              ...prevShape,
              data: getUpdatedShapeData(
                prevShape.shapeType,
                prevShape.data,
                brushPosition,
                gridCellNormalizedSize,
                mapWidth,
                mapHeight
              ),
            } as Shape;
          });
        }
      }
    }

    function handleBrushUp(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      if (isBrush && drawing && drawing.type === "path") {
        if (drawing.data.points.length > 1) {
          onShapeAdd(drawing);
        }
      } else if (isShape && drawing) {
        onShapeAdd(drawing);
      }

      eraseHoveredShapes();

      setDrawing(null);
      setIsBrushDown(false);
    }

    interactionEmitter?.on("dragStart", handleBrushDown);
    interactionEmitter?.on("drag", handleBrushMove);
    interactionEmitter?.on("dragEnd", handleBrushUp);

    return () => {
      interactionEmitter?.off("dragStart", handleBrushDown);
      interactionEmitter?.off("drag", handleBrushMove);
      interactionEmitter?.off("dragEnd", handleBrushUp);
    };
  });

  function handleShapeOver(shape: Drawing, isDown: boolean) {
    if (shouldHover && isDown) {
      if (erasingDrawings.findIndex((s) => s.id === shape.id) === -1) {
        setErasingDrawings((prevShapes) => [...prevShapes, shape]);
      }
    }
  }

  function eraseHoveredShapes() {
    if (erasingDrawings.length > 0) {
      onShapesRemove(erasingDrawings.map((shape) => shape.id));
      setErasingDrawings([]);
    }
  }

  function renderDrawing(shape: Drawing) {
    return (
      <DrawingShape
        drawing={shape}
        key={shape.id}
        onMouseMove={() => handleShapeOver(shape, isBrushDown)}
        onTouchOver={() => handleShapeOver(shape, isBrushDown)}
        onMouseDown={() => handleShapeOver(shape, true)}
        onTouchStart={() => handleShapeOver(shape, true)}
        onMouseUp={eraseHoveredShapes}
        onTouchEnd={eraseHoveredShapes}
        strokeWidth={gridStrokeWidth * shape.strokeWidth}
      />
    );
  }

  function renderErasingDrawing(drawing: Drawing) {
    const eraseShape: Drawing = {
      ...drawing,
      color: "primary",
    };
    return renderDrawing(eraseShape);
  }

  return (
    <Group>
      {drawings.map(renderDrawing)}
      {drawing && renderDrawing(drawing)}
      {erasingDrawings.length > 0 && erasingDrawings.map(renderErasingDrawing)}
    </Group>
  );
}

export default DrawingTool;
