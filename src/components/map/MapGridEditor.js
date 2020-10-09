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

  const handlePreviousPositionRef = useRef();

  function handleScaleCircleDragStart(event) {
    const handle = event.target;
    const position = getHandleNormalizedPosition(handle);
    handlePreviousPositionRef.current = position;
  }

  function handleScaleCircleDragMove(event) {
    const handle = event.target;
    onGridChange(getHandleInset(handle));
    handlePreviousPositionRef.current = getHandleNormalizedPosition(handle);
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
    stroke: "rgba(255, 255, 255, 0.75)",
    strokeWidth: editCircleRadius / 10,
  };

  function getHandleInset(handle) {
    const gridX = map.grid.size.x;
    const gridY = map.grid.size.y;

    const name = handle.name();

    // Find distance and direction of dragging
    const previousPosition = handlePreviousPositionRef.current;
    const position = getHandleNormalizedPosition(handle);
    const distance = Vector2.distance(previousPosition, position, "euclidean");
    const direction = Vector2.normalize(
      Vector2.subtract(position, previousPosition)
    );

    const inset = map.grid.inset;

    if (direction.x === 0 && direction.y === 0) {
      return inset;
    }

    // Scale the grid direction by the distance dragged and the
    // dot product between the drag direction and the grid direction
    // This drags the handle while keeping the aspect ratio
    if (name === "topLeft") {
      const gridDirection = Vector2.normalize({ x: gridX, y: gridY });
      const dot = Vector2.dot(direction, gridDirection);
      const offset = Vector2.multiply(gridDirection, distance * dot);
      const newPosition = Vector2.add(previousPosition, offset);
      return {
        topLeft: newPosition,
        bottomRight: inset.bottomRight,
      };
    } else if (name === "topRight") {
      const gridDirection = Vector2.normalize({ x: -gridX, y: gridY });
      const dot = Vector2.dot(direction, gridDirection);
      const offset = Vector2.multiply(gridDirection, distance * dot);
      const newPosition = Vector2.add(previousPosition, offset);
      return {
        topLeft: { x: inset.topLeft.x, y: newPosition.y },
        bottomRight: { x: newPosition.x, y: inset.bottomRight.y },
      };
    } else if (name === "bottomRight") {
      const gridDirection = Vector2.normalize({ x: -gridX, y: -gridY });
      const dot = Vector2.dot(direction, gridDirection);
      const offset = Vector2.multiply(gridDirection, distance * dot);
      const newPosition = Vector2.add(previousPosition, offset);
      return {
        topLeft: inset.topLeft,
        bottomRight: newPosition,
      };
    } else if (name === "bottomLeft") {
      const gridDirection = Vector2.normalize({ x: gridX, y: -gridY });
      const dot = Vector2.dot(direction, gridDirection);
      const offset = Vector2.multiply(gridDirection, distance * dot);
      const newPosition = Vector2.add(previousPosition, offset);
      return {
        topLeft: { x: newPosition.x, y: inset.topLeft.y },
        bottomRight: { x: inset.bottomRight.x, y: newPosition.y },
      };
    } else {
      return inset;
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

  function getHandleNormalizedPosition(handle) {
    return Vector2.divide({ x: handle.x(), y: handle.y() }, mapSize);
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
        name="topLeft"
        {...editCircleProps}
      />
      <Circle
        ref={topRightHandleRef}
        x={handlePositions.topRight.x}
        y={handlePositions.topRight.y}
        name="topRight"
        {...editCircleProps}
      />
      <Circle
        ref={bottomRightHandleRef}
        x={handlePositions.bottomRight.x}
        y={handlePositions.bottomRight.y}
        name="bottomRight"
        {...editCircleProps}
      />
      <Circle
        ref={bottomLeftHandleRef}
        x={handlePositions.bottomLeft.x}
        y={handlePositions.bottomLeft.y}
        name="bottomLeft"
        {...editCircleProps}
      />
    </Group>
  );
}

export default MapGridEditor;
