import Konva from "konva";
import { useState } from "react";
import { Circle, Group, Path } from "react-konva";

type TickProps = {
  x: number;
  y: number;
  scale: number;
  onClick: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
  cross: boolean;
};

export function Tick({ x, y, scale, onClick, cross }: TickProps) {
  const [fill, setFill] = useState("white");
  function handleEnter() {
    setFill("hsl(260, 100%, 80%)");
  }

  function handleLeave() {
    setFill("white");
  }
  return (
    <Group
      x={x}
      y={y}
      scaleX={scale}
      scaleY={scale}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
      onTap={onClick}
    >
      <Circle radius={12} fill="hsla(230, 25%, 18%, 0.8)" />
      <Path
        offsetX={12}
        offsetY={12}
        fill={fill}
        data={
          cross
            ? "M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"
            : "M9 16.2l-3.5-3.5c-.39-.39-1.01-.39-1.4 0-.39.39-.39 1.01 0 1.4l4.19 4.19c.39.39 1.02.39 1.41 0L20.3 7.7c.39-.39.39-1.01 0-1.4-.39-.39-1.01-.39-1.4 0L9 16.2z"
        }
      />
    </Group>
  );
}

export default Tick;
