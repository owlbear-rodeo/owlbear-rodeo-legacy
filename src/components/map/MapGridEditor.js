import React, { useContext, useRef } from "react";
import { Group, Circle, Rect } from "react-konva";

import MapInteractionContext from "../../contexts/MapInteractionContext";

import * as Vector2 from "../../helpers/vector2";

function MapGridEditor({ map, onGridChange }) {
  const {
    mapWidth,
    mapHeight,
    stageScale,
    setPreventMapInteraction,
  } = useContext(MapInteractionContext);

  const mapSize = { x: mapWidth, y: mapHeight };

  const topLeftHandleRef = useRef();
  const topRightHandleRef = useRef();
  const bottomRightHandleRef = useRef();
  const bottomLeftHandleRef = useRef();

  function handleScaleCircleDragStart() {}

  function handleScaleCircleDragMove(event) {
    onGridChange(getHandleInset(event.target));
  }

  function handleScaleCircleDragEnd(event) {
    onGridChange(getHandleInset(event.target));
    setPreventMapInteraction(false);
  }

  function handleInteractivePointerDown() {
    setPreventMapInteraction(true);
  }

  function handleInteractivePointerUp() {
    setPreventMapInteraction(false);
  }

  const editCircleRadius = Math.max(
    (Math.min(mapWidth, mapHeight) / 30) * Math.max(1 / stageScale, 1),
    1
  );

  const editCircleProps = {
    radius: editCircleRadius,
    fill: "rgba(0, 0, 0, 0.5)",
    stroke: "white",
    strokeWidth: editCircleRadius / 5,
    draggable: true,
    onDragStart: handleScaleCircleDragStart,
    onDragMove: handleScaleCircleDragMove,
    onDragEnd: handleScaleCircleDragEnd,
    onMouseDown: handleInteractivePointerDown,
    onMouseUp: handleInteractivePointerUp,
    onTouchStart: handleInteractivePointerDown,
    onTouchEnd: handleInteractivePointerUp,
  };

  const editRectProps = {
    fill: "transparent",
    stroke: "white",
    strokeWidth: editCircleRadius / 5,
  };

  function getHandleInset(handle) {
    const topLeftHandle = topLeftHandleRef.current;
    const topRightHandle = topRightHandleRef.current;
    const bottomRightHandle = bottomRightHandleRef.current;
    const bottomLeftHandle = bottomLeftHandleRef.current;

    const topLeft = Vector2.divide(
      { x: topLeftHandle.x(), y: topLeftHandle.y() },
      mapSize
    );
    const topRight = Vector2.divide(
      { x: topRightHandle.x(), y: topRightHandle.y() },
      mapSize
    );
    const bottomRight = Vector2.divide(
      { x: bottomRightHandle.x(), y: bottomRightHandle.y() },
      mapSize
    );
    const bottomLeft = Vector2.divide(
      { x: bottomLeftHandle.x(), y: bottomLeftHandle.y() },
      mapSize
    );

    if (handle === topLeftHandle || handle === bottomRightHandle) {
      return { topLeft, bottomRight };
    } else {
      return {
        topLeft: { x: bottomLeft.x, y: topRight.y },
        bottomRight: { x: topRight.x, y: bottomLeft.y },
      };
    }
  }

  function getHandlePositions() {
    const topLeft = Vector2.multiply(map.grid.inset.topLeft, mapSize);
    const bottomRight = Vector2.multiply(map.grid.inset.bottomRight, mapSize);

    const size = Vector2.subtract(bottomRight, topLeft);
    const offset = Vector2.multiply(topLeft, -1);

    return {
      topLeft,
      topRight: { x: bottomRight.x, y: topLeft.y },
      bottomRight,
      bottomLeft: { x: topLeft.x, y: bottomRight.y },
      size,
      offset,
    };
  }

  const handlePositions = getHandlePositions();

  return (
    <Group>
      <Rect
        width={handlePositions.size.x}
        height={handlePositions.size.y}
        offset={handlePositions.offset}
        {...editRectProps}
      />
      <Circle
        ref={topLeftHandleRef}
        x={handlePositions.topLeft.x}
        y={handlePositions.topLeft.y}
        {...editCircleProps}
      />
      <Circle
        ref={topRightHandleRef}
        x={handlePositions.topRight.x}
        y={handlePositions.topRight.y}
        {...editCircleProps}
      />
      <Circle
        ref={bottomRightHandleRef}
        x={handlePositions.bottomRight.x}
        y={handlePositions.bottomRight.y}
        {...editCircleProps}
      />
      <Circle
        ref={bottomLeftHandleRef}
        x={handlePositions.bottomLeft.x}
        y={handlePositions.bottomLeft.y}
        {...editCircleProps}
      />
    </Group>
  );
}

export default MapGridEditor;
