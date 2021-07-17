import { useState, useEffect } from "react";
import shortid from "shortid";
import { Group, Line, Rect, Circle } from "react-konva";

import {
  useDebouncedStageScale,
  useMapWidth,
  useMapHeight,
  useInteractionEmitter,
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
import colors from "../../helpers/colors";
import { getRelativePointerPosition } from "../../helpers/konva";

import useGridSnapping from "../../hooks/useGridSnapping";

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

function MapDrawing({
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

    function handleBrushDown() {
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
          strokeWidth: toolSettings.type === "line" ? 1 : 0,
          ...commonShapeData,
        } as Shape);
      }
      setIsBrushDown(true);
    }

    function handleBrushMove() {
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

    function handleBrushUp() {
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
    const defaultProps = {
      key: shape.id,
      onMouseMove: () => handleShapeOver(shape, isBrushDown),
      onTouchOver: () => handleShapeOver(shape, isBrushDown),
      onMouseDown: () => handleShapeOver(shape, true),
      onTouchStart: () => handleShapeOver(shape, true),
      onMouseUp: eraseHoveredShapes,
      onTouchEnd: eraseHoveredShapes,
      fill: colors[shape.color] || shape.color,
      opacity: shape.blend ? 0.5 : 1,
      id: shape.id,
    };
    if (shape.type === "path") {
      return (
        <Line
          points={shape.data.points.reduce(
            (acc: number[], point) => [
              ...acc,
              point.x * mapWidth,
              point.y * mapHeight,
            ],
            []
          )}
          stroke={colors[shape.color] || shape.color}
          tension={0.5}
          closed={shape.pathType === "fill"}
          fillEnabled={shape.pathType === "fill"}
          lineCap="round"
          lineJoin="round"
          strokeWidth={gridStrokeWidth * shape.strokeWidth}
          {...defaultProps}
        />
      );
    } else if (shape.type === "shape") {
      if (shape.shapeType === "rectangle") {
        return (
          <Rect
            x={shape.data.x * mapWidth}
            y={shape.data.y * mapHeight}
            width={shape.data.width * mapWidth}
            height={shape.data.height * mapHeight}
            {...defaultProps}
          />
        );
      } else if (shape.shapeType === "circle") {
        const minSide = mapWidth < mapHeight ? mapWidth : mapHeight;
        return (
          <Circle
            x={shape.data.x * mapWidth}
            y={shape.data.y * mapHeight}
            radius={shape.data.radius * minSide}
            {...defaultProps}
          />
        );
      } else if (shape.shapeType === "triangle") {
        return (
          <Line
            points={shape.data.points.reduce(
              (acc: number[], point) => [
                ...acc,
                point.x * mapWidth,
                point.y * mapHeight,
              ],
              []
            )}
            closed={true}
            {...defaultProps}
          />
        );
      } else if (shape.shapeType === "line") {
        return (
          <Line
            points={shape.data.points.reduce(
              (acc: number[], point) => [
                ...acc,
                point.x * mapWidth,
                point.y * mapHeight,
              ],
              []
            )}
            strokeWidth={gridStrokeWidth * shape.strokeWidth}
            stroke={colors[shape.color] || shape.color}
            lineCap="round"
            {...defaultProps}
          />
        );
      }
    }
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

export default MapDrawing;
