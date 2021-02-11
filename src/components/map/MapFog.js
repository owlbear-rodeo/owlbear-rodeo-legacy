import React, { useState, useEffect, useCallback, useRef } from "react";
import shortid from "shortid";
import { Group, Rect, Line, Circle } from "react-konva";
import useImage from "use-image";

import diagonalPattern from "../../images/DiagonalPattern.png";

import { useMapInteraction } from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import { useGrid } from "../../contexts/GridContext";
import { useKeyboard } from "../../contexts/KeyboardContext";

import Vector2 from "../../helpers/Vector2";
import {
  simplifyPoints,
  mergeFogShapes,
  getFogShapesBoundingBoxes,
  getGuidesFromBoundingBoxes,
  getGuidesFromGridCell,
  findBestGuides,
  getSnappingVertex,
} from "../../helpers/drawing";
import colors from "../../helpers/colors";
import {
  HoleyLine,
  Tick,
  getRelativePointerPosition,
} from "../../helpers/konva";

import useDebounce from "../../hooks/useDebounce";
import useSetting from "../../hooks/useSetting";

function MapFog({
  map,
  shapes,
  onShapeAdd,
  onShapeCut,
  onShapesRemove,
  onShapesEdit,
  active,
  toolSettings,
  editable,
}) {
  const {
    stageScale,
    mapWidth,
    mapHeight,
    interactionEmitter,
  } = useMapInteraction();
  const {
    grid,
    gridCellNormalizedSize,
    gridCellPixelSize,
    gridStrokeWidth,
    gridCellPixelOffset,
    gridOffset,
  } = useGrid();
  const [gridSnappingSensitivity] = useSetting("map.gridSnappingSensitivity");
  const mapStageRef = useMapStage();

  const [drawingShape, setDrawingShape] = useState(null);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [editingShapes, setEditingShapes] = useState([]);

  // Shapes that have been merged for fog
  const [fogShapes, setFogShapes] = useState(shapes);
  // Bounding boxes for guides
  const [fogShapeBoundingBoxes, setFogShapeBoundingBoxes] = useState([]);
  const [guides, setGuides] = useState([]);
  const [vertexSnapping, setVertexSnapping] = useState();

  const shouldHover =
    active &&
    editable &&
    (toolSettings.type === "toggle" || toolSettings.type === "remove");

  const shouldRenderGuides =
    active &&
    editable &&
    (toolSettings.type === "rectangle" || toolSettings.type === "polygon") &&
    !vertexSnapping;
  const shouldRenderVertexSnapping =
    active &&
    editable &&
    (toolSettings.type === "rectangle" ||
      toolSettings.type === "polygon" ||
      toolSettings.type === "brush") &&
    toolSettings.useEdgeSnapping &&
    vertexSnapping;

  const [patternImage] = useImage(diagonalPattern);

  useEffect(() => {
    if (!active || !editable) {
      return;
    }

    const mapStage = mapStageRef.current;

    function getBrushPosition(snapping = true) {
      const mapImage = mapStage.findOne("#mapImage");
      let position = getRelativePointerPosition(mapImage);
      if (snapping) {
        if (shouldRenderVertexSnapping) {
          position = Vector2.multiply(vertexSnapping, {
            x: mapWidth,
            y: mapHeight,
          });
        } else if (shouldRenderGuides) {
          for (let guide of guides) {
            if (guide.orientation === "vertical") {
              position.x = guide.start.x * mapWidth;
            }
            if (guide.orientation === "horizontal") {
              position.y = guide.start.y * mapHeight;
            }
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
        const brushPosition = getBrushPosition();
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
                gridCellNormalizedSize,
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
        const brushPosition = getBrushPosition();
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
      if (
        active &&
        (toolSettings.type === "polygon" ||
          toolSettings.type === "rectangle") &&
        !shouldRenderVertexSnapping
      ) {
        let guides = [];
        const brushPosition = getBrushPosition(false);
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
      if (
        active &&
        toolSettings.useEdgeSnapping &&
        (toolSettings.type === "polygon" ||
          toolSettings.type === "rectangle" ||
          toolSettings.type === "brush")
      ) {
        const brushPosition = getBrushPosition(false);
        setVertexSnapping(
          getSnappingVertex(
            brushPosition,
            fogShapes,
            fogShapeBoundingBoxes,
            gridCellNormalizedSize,
            Math.min(0.4 / stageScale, 0.4)
          )
        );
      }
      if (toolSettings.type === "polygon") {
        const brushPosition = getBrushPosition();
        if (toolSettings.type === "polygon" && drawingShape) {
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
        stroke={
          editable ? colors.lightGray : colors[shape.color] || shape.color
        }
        fill={colors[shape.color] || shape.color}
        closed
        lineCap="round"
        lineJoin="round"
        strokeWidth={editable ? gridStrokeWidth * shape.strokeWidth : 0}
        opacity={editable ? (!shape.visible ? 0.2 : 0.5) : 1}
        fillPatternImage={patternImage}
        fillPriority={active && !shape.visible ? "pattern" : "color"}
        holes={holes}
        // Disable collision if the fog is transparent and we're not editing it
        // This allows tokens to be moved under the fog
        hitFunc={editable && !active ? () => {} : undefined}
        // shadowColor={editable ? "rgba(0, 0, 0, 0)" : "rgba(34, 34, 34, 1)"}
        // shadowOffset={{ x: 0, y: 5 }}
        // shadowBlur={10}
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

  function renderSnappingVertex() {
    return (
      <Circle
        x={vertexSnapping.x * mapWidth}
        y={vertexSnapping.y * mapHeight}
        radius={gridStrokeWidth}
        stroke="hsl(260, 100%, 80%)"
        strokeWidth={gridStrokeWidth * 0.25}
      />
    );
  }

  useEffect(() => {
    function shapeVisible(shape) {
      return (active && !toolSettings.preview) || shape.visible;
    }

    if (editable) {
      const visibleShapes = shapes.filter(shapeVisible);
      setFogShapeBoundingBoxes(getFogShapesBoundingBoxes(visibleShapes));
      setFogShapes(visibleShapes);
    } else {
      setFogShapes(mergeFogShapes(shapes));
    }
  }, [shapes, editable, active, toolSettings]);

  const fogGroupRef = useRef();

  return (
    <Group>
      <Group ref={fogGroupRef}>
        {/* Render a blank shape so cache works with no fog shapes */}
        <Rect width={1} height={1} />
        {fogShapes.map(renderShape)}
      </Group>
      {shouldRenderGuides && renderGuides()}
      {shouldRenderVertexSnapping && renderSnappingVertex()}
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
