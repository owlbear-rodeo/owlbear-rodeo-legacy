import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import shortid from "shortid";
import { Group, Rect } from "react-konva";
import useImage from "use-image";

import diagonalPattern from "../../images/DiagonalPattern.png";

import MapInteractionContext from "../../contexts/MapInteractionContext";
import MapStageContext from "../../contexts/MapStageContext";

import Vector2 from "../../helpers/Vector2";
import {
  getFogBrushPosition,
  simplifyPoints,
  getStrokeWidth,
  mergeShapes,
} from "../../helpers/drawing";
import colors from "../../helpers/colors";
import { HoleyLine, Tick } from "../../helpers/konva";

import useKeyboard from "../../hooks/useKeyboard";
import useDebounce from "../../hooks/useDebounce";

function MapFog({
  map,
  shapes,
  onShapeAdd,
  onShapeCut,
  onShapesRemove,
  onShapesEdit,
  active,
  toolSettings,
  gridSize,
  editable,
}) {
  const { stageScale, mapWidth, mapHeight, interactionEmitter } = useContext(
    MapInteractionContext
  );
  const mapStageRef = useContext(MapStageContext);
  const [drawingShape, setDrawingShape] = useState(null);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [editingShapes, setEditingShapes] = useState([]);

  const shouldHover =
    active &&
    editable &&
    (toolSettings.type === "toggle" || toolSettings.type === "remove");

  const [patternImage] = useImage(diagonalPattern);

  useEffect(() => {
    if (!active || !editable) {
      return;
    }

    const mapStage = mapStageRef.current;

    const useGridSnapping =
      map.snapToGrid &&
      (toolSettings.type === "polygon" || toolSettings.type === "rectangle");

    function handleBrushDown() {
      const brushPosition = getFogBrushPosition(
        map,
        mapStage,
        useGridSnapping,
        gridSize,
        toolSettings.useEdgeSnapping,
        shapes
      );
      if (toolSettings.type === "brush") {
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
        const brushPosition = getFogBrushPosition(
          map,
          mapStage,
          useGridSnapping,
          gridSize,
          toolSettings.useEdgeSnapping,
          shapes
        );
        setDrawingShape((prevShape) => {
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
          return {
            ...prevShape,
            data: {
              ...prevShape.data,
              points: [...prevPoints, brushPosition],
            },
          };
        });
      }
      if (toolSettings.type === "rectangle" && isBrushDown && drawingShape) {
        const prevPoints = drawingShape.data.points;
        const brushPosition = getFogBrushPosition(
          map,
          mapStage,
          useGridSnapping,
          gridSize,
          toolSettings.useEdgeSnapping,
          shapes,
          prevPoints
        );
        setDrawingShape((prevShape) => {
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
        toolSettings.type === "brush" ||
        (toolSettings.type === "rectangle" && drawingShape)
      ) {
        const cut = toolSettings.useFogCut;
        if (drawingShape.data.points.length > 1) {
          let shapeData = {};
          if (cut) {
            shapeData = { id: drawingShape.id, type: drawingShape.type };
          } else {
            shapeData = { ...drawingShape, color: "black" };
          }
          const shape = {
            ...shapeData,
            data: {
              ...drawingShape.data,
              points: simplifyPoints(
                drawingShape.data.points,
                gridSize,
                // Downscale fog as smoothing doesn't currently work with edge snapping
                stageScale / 2
              ),
            },
          };
          if (cut) {
            onShapeCut(shape);
          } else {
            onShapeAdd(shape);
          }
        }
        setDrawingShape(null);
      }

      eraseHoveredShapes();

      setIsBrushDown(false);
    }

    function handlePolygonClick() {
      if (toolSettings.type === "polygon") {
        const brushPosition = getFogBrushPosition(
          map,
          mapStage,
          useGridSnapping,
          gridSize,
          toolSettings.useEdgeSnapping,
          shapes
        );
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

    function handlePolygonMove() {
      if (toolSettings.type === "polygon" && drawingShape) {
        const brushPosition = getFogBrushPosition(
          map,
          mapStage,
          useGridSnapping,
          gridSize,
          toolSettings.useEdgeSnapping,
          shapes
        );
        setDrawingShape((prevShape) => {
          if (!prevShape) {
            return;
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

    interactionEmitter.on("dragStart", handleBrushDown);
    interactionEmitter.on("drag", handleBrushMove);
    interactionEmitter.on("dragEnd", handleBrushUp);
    // Use mouse events for polygon and erase to allow for single clicks
    mapStage.on("mousedown touchstart", handlePolygonMove);
    mapStage.on("mousemove touchmove", handlePolygonMove);
    mapStage.on("click tap", handlePolygonClick);

    return () => {
      interactionEmitter.off("dragStart", handleBrushDown);
      interactionEmitter.off("drag", handleBrushMove);
      interactionEmitter.off("dragEnd", handleBrushUp);
      mapStage.off("mousedown touchstart", handlePolygonMove);
      mapStage.off("mousemove touchmove", handlePolygonMove);
      mapStage.off("click tap", handlePolygonClick);
    };
  });

  const finishDrawingPolygon = useCallback(() => {
    const cut = toolSettings.useFogCut;
    const data = {
      ...drawingShape.data,
      // Remove the last point as it hasn't been placed yet
      points: drawingShape.data.points.slice(0, -1),
    };
    if (cut) {
      onShapeCut({
        id: drawingShape.id,
        type: drawingShape.type,
        data: data,
      });
    } else {
      onShapeAdd({ ...drawingShape, data: data, color: "black" });
    }

    setDrawingShape(null);
  }, [toolSettings, drawingShape, onShapeCut, onShapeAdd]);

  // Add keyboard shortcuts
  function handleKeyDown({ key }) {
    if (key === "Enter" && toolSettings.type === "polygon" && drawingShape) {
      finishDrawingPolygon();
    }
    if (key === "Escape" && drawingShape) {
      setDrawingShape(null);
    }
  }

  useKeyboard(handleKeyDown);

  // Update shape color when useFogCut changes
  useEffect(() => {
    setDrawingShape((prevShape) => {
      if (!prevShape) {
        return;
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

  function handleShapeOver(shape, isDown) {
    if (shouldHover && isDown) {
      if (editingShapes.findIndex((s) => s.id === shape.id) === -1) {
        setEditingShapes((prevShapes) => [...prevShapes, shape]);
      }
    }
  }

  function reducePoints(acc, point) {
    return [...acc, point.x * mapWidth, point.y * mapHeight];
  }

  function renderShape(shape) {
    const points = shape.data.points.reduce(reducePoints, []);
    const holes =
      shape.data.holes &&
      shape.data.holes.map((hole) => hole.reduce(reducePoints, []));
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
        stroke={editable ? colors.white : colors[shape.color] || shape.color}
        fill={colors[shape.color] || shape.color}
        closed
        lineCap="round"
        lineJoin="round"
        strokeWidth={getStrokeWidth(
          shape.strokeWidth,
          gridSize,
          mapWidth,
          mapHeight
        )}
        opacity={editable ? 0.5 : 1}
        fillPatternImage={patternImage}
        fillPriority={active && !shape.visible ? "pattern" : "color"}
        holes={holes}
        // Disable collision if the fog is transparent and we're not editing it
        // This allows tokens to be moved under the fog
        hitFunc={editable && !active ? () => {} : undefined}
        shadowColor={editable ? "rgba(0, 0, 0, 0)" : "rgba(0, 0, 0, 0.33)"}
        shadowOffset={{ x: 0, y: 5 }}
        shadowBlur={10}
      />
    );
  }

  function renderEditingShape(shape) {
    const editingShape = {
      ...shape,
      color: "#BB99FF",
    };
    return renderShape(editingShape);
  }

  function renderPolygonAcceptTick(shape) {
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

  const [fogShapes, setFogShapes] = useState(shapes);
  useEffect(() => {
    function shapeVisible(shape) {
      return (active && !toolSettings.preview) || shape.visible;
    }

    if (editable) {
      setFogShapes(shapes.filter(shapeVisible));
    } else {
      setFogShapes(mergeShapes(shapes));
    }
  }, [shapes, editable, active, toolSettings]);

  const fogGroupRef = useRef();
  const debouncedStageScale = useDebounce(stageScale, 50);

  useEffect(() => {
    const fogGroup = fogGroupRef.current;

    if (!editable) {
      const canvas = fogGroup.getChildren()[0].getCanvas();
      const pixelRatio = canvas.pixelRatio || 1;

      // Constrain fog buffer to the map resolution
      const fogRect = fogGroup.getClientRect();
      const maxMapSize = map ? Math.max(map.width, map.height) : 4096; // Default to 4096
      const maxFogSize =
        Math.max(fogRect.width, fogRect.height) / debouncedStageScale;
      const maxPixelRatio = maxMapSize / maxFogSize;

      fogGroup.cache({
        pixelRatio: Math.min(
          Math.max(debouncedStageScale * pixelRatio, 1),
          maxPixelRatio
        ),
      });
    } else {
      fogGroup.clearCache();
    }

    fogGroup.getLayer().draw();
  }, [fogShapes, editable, active, debouncedStageScale, mapWidth, map]);

  return (
    <Group>
      <Group ref={fogGroupRef}>
        {/* Render a blank shape so cache works with no fog shapes */}
        <Rect width={1} height={1} />
        {fogShapes.map(renderShape)}
      </Group>
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
