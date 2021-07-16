import { useState, useEffect, useCallback } from "react";
import shortid from "shortid";
import { Group, Line } from "react-konva";
import useImage from "use-image";
import Color from "color";

import diagonalPattern from "../../images/DiagonalPattern.png";

import {
  useDebouncedStageScale,
  useMapWidth,
  useMapHeight,
  useInteractionEmitter,
} from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import {
  useGrid,
  useGridCellPixelSize,
  useGridCellNormalizedSize,
  useGridStrokeWidth,
  useGridCellPixelOffset,
  useGridOffset,
} from "../../contexts/GridContext";
import { useKeyboard } from "../../contexts/KeyboardContext";

import Vector2, { BoundingBox } from "../../helpers/Vector2";
import {
  simplifyPoints,
  mergeFogShapes,
  getFogShapesBoundingBoxes,
  getGuidesFromBoundingBoxes,
  getGuidesFromGridCell,
  findBestGuides,
  Guide,
} from "../../helpers/drawing";
import colors from "../../helpers/colors";
import {
  HoleyLine,
  Tick,
  getRelativePointerPosition,
} from "../../helpers/konva";
import { keyBy } from "../../helpers/shared";

import SubtractFogAction from "../../actions/SubtractFogAction";
import CutFogAction from "../../actions/CutFogAction";

import useSetting from "../../hooks/useSetting";

import shortcuts from "../../shortcuts";

import { Map } from "../../types/Map";
import { Fog, FogToolSettings } from "../../types/Fog";

type FogAddEventHandler = (fog: Fog[]) => void;
type FogCutEventHandler = (fog: Fog[]) => void;
type FogRemoveEventHandler = (fogId: string[]) => void;
type FogEditEventHandler = (edit: Partial<Fog>[]) => void;
type FogErrorEventHandler = (message: string) => void;

type MapFogProps = {
  map: Map;
  shapes: Fog[];
  onShapesAdd: FogAddEventHandler;
  onShapesCut: FogCutEventHandler;
  onShapesRemove: FogRemoveEventHandler;
  onShapesEdit: FogEditEventHandler;
  onShapeError: FogErrorEventHandler;
  active: boolean;
  toolSettings: FogToolSettings;
  editable: boolean;
};

function MapFog({
  map,
  shapes,
  onShapesAdd,
  onShapesCut,
  onShapesRemove,
  onShapesEdit,
  onShapeError,
  active,
  toolSettings,
  editable,
}: MapFogProps) {
  const stageScale = useDebouncedStageScale();
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const interactionEmitter = useInteractionEmitter();

  const grid = useGrid();
  const gridCellNormalizedSize = useGridCellNormalizedSize();
  const gridCellPixelSize = useGridCellPixelSize();
  const gridStrokeWidth = useGridStrokeWidth();
  const gridCellPixelOffset = useGridCellPixelOffset();
  const gridOffset = useGridOffset();

  const [gridSnappingSensitivity] = useSetting<number>(
    "map.gridSnappingSensitivity"
  );
  const [showFogGuides] = useSetting<boolean>("fog.showGuides");
  const [editOpacity] = useSetting<number>("fog.editOpacity");
  const mapStageRef = useMapStage();

  const [drawingShape, setDrawingShape] = useState<Fog | null>(null);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [editingShapes, setEditingShapes] = useState<Fog[]>([]);

  // Shapes that have been merged for fog
  const [fogShapes, setFogShapes] = useState(shapes);
  // Bounding boxes for guides
  const [fogShapeBoundingBoxes, setFogShapeBoundingBoxes] = useState<
    BoundingBox[]
  >([]);
  const [guides, setGuides] = useState<Guide[]>([]);

  const shouldHover =
    active &&
    editable &&
    (toolSettings.type === "toggle" || toolSettings.type === "remove");

  const shouldUseGuides =
    active &&
    editable &&
    (toolSettings.type === "rectangle" || toolSettings.type === "polygon");

  const shouldRenderGuides = shouldUseGuides && showFogGuides;

  const [patternImage] = useImage(diagonalPattern);

  useEffect(() => {
    if (!active || !editable) {
      return;
    }

    const mapStage = mapStageRef.current;

    function getBrushPosition(snapping = true) {
      if (!mapStage) {
        return;
      }
      const mapImage = mapStage.findOne("#mapImage");
      let position = getRelativePointerPosition(mapImage);
      if (!position) {
        return;
      }
      if (shouldUseGuides && snapping) {
        for (let guide of guides) {
          if (guide.orientation === "vertical") {
            position.x = guide.start.x * mapWidth;
          }
          if (guide.orientation === "horizontal") {
            position.y = guide.start.y * mapHeight;
          }
        }
      }
      return Vector2.divide(position, {
        x: mapImage.width(),
        y: mapImage.height(),
      });
    }

    function handleBrushDown() {
      if (toolSettings.type === "brush") {
        const brushPosition = getBrushPosition();
        if (!brushPosition) {
          return;
        }
        setDrawingShape({
          type: "fog",
          data: {
            points: [brushPosition],
            holes: [],
          },
          strokeWidth: 0.5,
          color: toolSettings.useFogCut ? "red" : "black",
          id: shortid.generate(),
          visible: true,
        });
      }
      if (toolSettings.type === "rectangle") {
        const brushPosition = getBrushPosition();
        if (!brushPosition) {
          return;
        }
        setDrawingShape({
          type: "fog",
          data: {
            points: [
              brushPosition,
              brushPosition,
              brushPosition,
              brushPosition,
            ],
            holes: [],
          },
          strokeWidth: 0.5,
          color: toolSettings.useFogCut ? "red" : "black",
          id: shortid.generate(),
          visible: true,
        });
      }
      setIsBrushDown(true);
    }

    function handleBrushMove() {
      if (toolSettings.type === "brush" && isBrushDown && drawingShape) {
        const brushPosition = getBrushPosition();
        if (!brushPosition) {
          return;
        }
        setDrawingShape((prevShape) => {
          if (!prevShape) {
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
            data: {
              ...prevShape.data,
              points: simplified,
            },
          };
        });
      }
      if (toolSettings.type === "rectangle" && isBrushDown && drawingShape) {
        const prevPoints = drawingShape.data.points;
        const brushPosition = getBrushPosition();
        if (!brushPosition) {
          return;
        }
        setDrawingShape((prevShape) => {
          if (!prevShape) {
            return prevShape;
          }
          return {
            ...prevShape,
            data: {
              ...prevShape.data,
              points: [
                prevPoints[0],
                { x: brushPosition.x, y: prevPoints[1].y },
                brushPosition,
                { x: prevPoints[3].x, y: brushPosition.y },
              ],
            },
          };
        });
      }
    }

    function handleBrushUp() {
      if (
        (toolSettings.type === "brush" || toolSettings.type === "rectangle") &&
        drawingShape
      ) {
        const cut = toolSettings.useFogCut;
        let drawingShapes = [drawingShape];

        // Filter out hidden or visible shapes if single layer enabled
        if (!toolSettings.multilayer) {
          const shapesToSubtract = shapes.filter((shape) =>
            cut ? !shape.visible : shape.visible
          );
          const subtractAction = new SubtractFogAction(shapesToSubtract);
          const state = subtractAction.execute({
            [drawingShape.id]: drawingShape,
          });
          drawingShapes = Object.values(state)
            .filter((shape) => shape.data.points.length > 2)
            .map((shape) => ({ ...shape, id: shortid.generate() }));
        }

        if (drawingShapes.length > 0) {
          if (cut) {
            // Run a pre-emptive cut action to check whether we've cut anything
            const cutAction = new CutFogAction(drawingShapes);
            const state = cutAction.execute(keyBy(shapes, "id"));

            if (Object.keys(state).length === shapes.length) {
              onShapeError("No fog to cut");
            } else {
              onShapesCut(drawingShapes);
            }
          } else {
            onShapesAdd(
              drawingShapes.map((shape) => ({ ...shape, color: "black" }))
            );
          }
        } else {
          if (cut) {
            onShapeError("Fog already cut");
          } else {
            onShapeError("Fog already placed");
          }
        }
        setDrawingShape(null);
      }

      eraseHoveredShapes();

      setIsBrushDown(false);
    }

    function handlePointerClick() {
      if (toolSettings.type === "polygon") {
        const brushPosition = getBrushPosition();
        if (brushPosition) {
          setDrawingShape((prevDrawingShape) => {
            if (prevDrawingShape) {
              return {
                ...prevDrawingShape,
                data: {
                  ...prevDrawingShape.data,
                  points: [...prevDrawingShape.data.points, brushPosition],
                },
              };
            } else {
              return {
                type: "fog",
                data: {
                  points: [brushPosition, brushPosition],
                  holes: [],
                },
                strokeWidth: 0.5,
                color: toolSettings.useFogCut ? "red" : "black",
                id: shortid.generate(),
                visible: true,
              };
            }
          });
        }
      }
    }

    function handlePointerMove() {
      if (shouldUseGuides) {
        let guides: Guide[] = [];
        const brushPosition = getBrushPosition(false);
        if (brushPosition) {
          const absoluteBrushPosition = Vector2.multiply(brushPosition, {
            x: mapWidth,
            y: mapHeight,
          });
          if (map.snapToGrid) {
            guides.push(
              ...getGuidesFromGridCell(
                absoluteBrushPosition,
                grid,
                gridCellPixelSize,
                gridOffset,
                gridCellPixelOffset,
                gridSnappingSensitivity,
                { x: mapWidth, y: mapHeight }
              )
            );
          }

          guides.push(
            ...getGuidesFromBoundingBoxes(
              brushPosition,
              fogShapeBoundingBoxes,
              gridCellNormalizedSize,
              gridSnappingSensitivity
            )
          );

          setGuides(findBestGuides(brushPosition, guides));
        }
      }
      if (toolSettings.type === "polygon") {
        const brushPosition = getBrushPosition();
        if (toolSettings.type === "polygon" && drawingShape && brushPosition) {
          setDrawingShape((prevShape) => {
            if (!prevShape) {
              return prevShape;
            }
            return {
              ...prevShape,
              data: {
                ...prevShape.data,
                points: [...prevShape.data.points.slice(0, -1), brushPosition],
              },
            };
          });
        }
      }
    }

    function handelTouchEnd() {
      setGuides([]);
    }

    interactionEmitter?.on("dragStart", handleBrushDown);
    interactionEmitter?.on("drag", handleBrushMove);
    interactionEmitter?.on("dragEnd", handleBrushUp);
    // Use mouse events for polygon and erase to allow for single clicks
    mapStage?.on("mousedown touchstart", handlePointerMove);
    mapStage?.on("mousemove touchmove", handlePointerMove);
    mapStage?.on("click tap", handlePointerClick);
    mapStage?.on("touchend", handelTouchEnd);

    return () => {
      interactionEmitter?.off("dragStart", handleBrushDown);
      interactionEmitter?.off("drag", handleBrushMove);
      interactionEmitter?.off("dragEnd", handleBrushUp);
      mapStage?.off("mousedown touchstart", handlePointerMove);
      mapStage?.off("mousemove touchmove", handlePointerMove);
      mapStage?.off("click tap", handlePointerClick);
      mapStage?.off("touchend", handelTouchEnd);
    };
  });

  const finishDrawingPolygon = useCallback(() => {
    const cut = toolSettings.useFogCut;
    if (!drawingShape) {
      return;
    }
    let polygonShape = {
      ...drawingShape,
      data: {
        ...drawingShape.data,
        // Remove the last point as it hasn't been placed yet
        points: drawingShape.data.points.slice(0, -1),
      },
    };

    let polygonShapes = [polygonShape];
    // Filter out hidden or visible shapes if single layer enabled
    if (!toolSettings.multilayer) {
      const shapesToSubtract = shapes.filter((shape) =>
        cut ? !shape.visible : shape.visible
      );
      const subtractAction = new SubtractFogAction(shapesToSubtract);
      const state = subtractAction.execute({
        [polygonShape.id]: polygonShape,
      });
      polygonShapes = Object.values(state)
        .filter((shape) => shape.data.points.length > 2)
        .map((shape) => ({ ...shape, id: shortid.generate() }));
    }

    if (polygonShapes.length > 0) {
      if (cut) {
        // Run a pre-emptive cut action to check whether we've cut anything
        const cutAction = new CutFogAction(polygonShapes);
        const state = cutAction.execute(keyBy(shapes, "id"));

        if (Object.keys(state).length === shapes.length) {
          onShapeError("No fog to cut");
        } else {
          onShapesCut(polygonShapes);
        }
      } else {
        onShapesAdd(
          polygonShapes.map((shape) => ({
            ...drawingShape,
            data: shape.data,
            id: shape.id,
            color: "black",
          }))
        );
      }
    } else {
      if (cut) {
        onShapeError("Fog already cut");
      } else {
        onShapeError("Fog already placed");
      }
    }

    setDrawingShape(null);
  }, [
    toolSettings,
    drawingShape,
    onShapesCut,
    onShapesAdd,
    onShapeError,
    shapes,
  ]);

  // Add keyboard shortcuts
  function handleKeyDown(event: KeyboardEvent) {
    if (
      shortcuts.fogFinishPolygon(event) &&
      toolSettings.type === "polygon" &&
      drawingShape
    ) {
      finishDrawingPolygon();
    }
    if (shortcuts.fogCancelPolygon(event) && drawingShape) {
      setDrawingShape(null);
    }
    // Remove last point from polygon shape if delete pressed
    if (
      shortcuts.delete(event) &&
      drawingShape &&
      toolSettings.type === "polygon"
    ) {
      if (drawingShape.data.points.length > 2) {
        setDrawingShape((prevShape) => {
          if (!prevShape) {
            return prevShape;
          }
          return {
            ...prevShape,
            data: {
              ...prevShape.data,
              points: [
                // Shift last point to previous point
                ...prevShape.data.points.slice(0, -2),
                ...prevShape.data.points.slice(-1),
              ],
            },
          };
        });
      } else {
        setDrawingShape(null);
      }
    }
  }

  useKeyboard(handleKeyDown);

  // Update shape color when useFogCut changes
  useEffect(() => {
    setDrawingShape((prevShape) => {
      if (!prevShape) {
        return prevShape;
      }
      return {
        ...prevShape,
        color: toolSettings.useFogCut ? "red" : "black",
      };
    });
  }, [toolSettings.useFogCut]);

  function eraseHoveredShapes() {
    // Erase
    if (editingShapes.length > 0) {
      if (toolSettings.type === "remove") {
        onShapesRemove(editingShapes.map((shape) => shape.id));
      } else if (toolSettings.type === "toggle") {
        onShapesEdit(
          editingShapes.map((shape) => ({
            id: shape.id,
            visible: !shape.visible,
          }))
        );
      }
      setEditingShapes([]);
    }
  }

  function handleShapeOver(shape: Fog, isDown: boolean) {
    if (shouldHover && isDown) {
      if (editingShapes.findIndex((s) => s.id === shape.id) === -1) {
        setEditingShapes((prevShapes) => [...prevShapes, shape]);
      }
    }
  }

  function reducePoints(acc: number[], point: Vector2) {
    return [...acc, point.x * mapWidth, point.y * mapHeight];
  }

  function renderShape(shape: Fog) {
    const points = shape.data.points.reduce(reducePoints, []);
    const holes =
      shape.data.holes &&
      shape.data.holes.map((hole) => hole.reduce(reducePoints, []));
    const opacity = editable ? editOpacity : 1;
    // Control opacity only on fill as using opacity with stroke leads to performance issues
    const fill = new Color(colors[shape.color] || shape.color)
      .alpha(opacity)
      .string();
    const stroke =
      editable && active
        ? colors.lightGray
        : colors[shape.color] || shape.color;
    return (
      <HoleyLine
        key={shape.id}
        onMouseMove={() => handleShapeOver(shape, isBrushDown)}
        onTouchOver={() => handleShapeOver(shape, isBrushDown)}
        onMouseDown={() => handleShapeOver(shape, true)}
        onTouchStart={() => handleShapeOver(shape, true)}
        onMouseUp={eraseHoveredShapes}
        onTouchEnd={eraseHoveredShapes}
        points={points}
        stroke={stroke}
        fill={fill}
        closed
        lineCap="round"
        lineJoin="round"
        strokeWidth={gridStrokeWidth * shape.strokeWidth}
        fillPatternImage={patternImage}
        fillPriority={editable && !shape.visible ? "pattern" : "color"}
        holes={holes}
        // Disable collision if the fog is transparent and we're not editing it
        // This allows tokens to be moved under the fog
        hitFunc={editable && !active ? () => {} : undefined}
      />
    );
  }

  function renderEditingShape(shape: Fog) {
    const editingShape: Fog = {
      ...shape,
      color: "primary",
    };
    return renderShape(editingShape);
  }

  function renderPolygonAcceptTick(shape: Fog) {
    if (shape.data.points.length === 0) {
      return null;
    }
    const isCross = shape.data.points.length < 4;
    return (
      <Tick
        x={shape.data.points[0].x * mapWidth}
        y={shape.data.points[0].y * mapHeight}
        scale={1 / stageScale}
        cross={isCross}
        onClick={(e) => {
          e.cancelBubble = true;
          if (isCross) {
            setDrawingShape(null);
          } else {
            finishDrawingPolygon();
          }
        }}
      />
    );
  }

  function renderGuides() {
    return guides.map((guide, index) => (
      <Line
        points={[
          guide.start.x * mapWidth,
          guide.start.y * mapHeight,
          guide.end.x * mapWidth,
          guide.end.y * mapHeight,
        ]}
        stroke="hsl(260, 100%, 80%)"
        key={index}
        strokeWidth={gridStrokeWidth * 0.25}
        lineCap="round"
        lineJoin="round"
      />
    ));
  }

  useEffect(() => {
    function shapeVisible(shape: Fog) {
      return (active && !toolSettings.preview) || shape.visible;
    }

    if (editable) {
      const visibleShapes = shapes.filter(shapeVisible);
      // Only use bounding box guides when rendering them
      if (shouldRenderGuides) {
        setFogShapeBoundingBoxes(getFogShapesBoundingBoxes(visibleShapes, 5));
      } else {
        setFogShapeBoundingBoxes([]);
      }
      setFogShapes(visibleShapes);
    } else {
      setFogShapes(mergeFogShapes(shapes));
    }
  }, [shapes, editable, active, toolSettings, shouldRenderGuides]);

  return (
    <Group>
      <Group>{fogShapes.map(renderShape)}</Group>
      {shouldRenderGuides && renderGuides()}
      {drawingShape && renderShape(drawingShape)}
      {drawingShape &&
        toolSettings &&
        toolSettings.type === "polygon" &&
        renderPolygonAcceptTick(drawingShape)}
      {editingShapes.length > 0 && editingShapes.map(renderEditingShape)}
    </Group>
  );
}

export default MapFog;
