import Konva from "konva";
import { Circle, Line, Rect } from "react-konva";
import {
  useMapHeight,
  useMapWidth,
} from "../../contexts/MapInteractionContext";
import colors from "../../helpers/colors";

import { Drawing as DrawingType } from "../../types/Drawing";

type DrawingProps = {
  drawing: DrawingType;
} & Konva.ShapeConfig;

function Drawing({ drawing, ...props }: DrawingProps) {
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();

  const defaultProps = {
    fill: colors[drawing.color] || drawing.color,
    opacity: drawing.blend ? 0.5 : 1,
    id: drawing.id,
  };

  if (drawing.type === "path") {
    return (
      <Line
        points={drawing.data.points.reduce(
          (acc: number[], point) => [
            ...acc,
            point.x * mapWidth,
            point.y * mapHeight,
          ],
          []
        )}
        stroke={colors[drawing.color] || drawing.color}
        tension={0.5}
        closed={drawing.pathType === "fill"}
        fillEnabled={drawing.pathType === "fill"}
        lineCap="round"
        lineJoin="round"
        {...defaultProps}
        {...props}
      />
    );
  } else if (drawing.type === "shape") {
    if (drawing.shapeType === "rectangle") {
      return (
        <Rect
          x={drawing.data.x * mapWidth}
          y={drawing.data.y * mapHeight}
          width={drawing.data.width * mapWidth}
          height={drawing.data.height * mapHeight}
          {...defaultProps}
          {...props}
        />
      );
    } else if (drawing.shapeType === "circle") {
      const minSide = mapWidth < mapHeight ? mapWidth : mapHeight;
      return (
        <Circle
          x={drawing.data.x * mapWidth}
          y={drawing.data.y * mapHeight}
          radius={drawing.data.radius * minSide}
          {...defaultProps}
          {...props}
        />
      );
    } else if (drawing.shapeType === "triangle") {
      return (
        <Line
          points={drawing.data.points.reduce(
            (acc: number[], point) => [
              ...acc,
              point.x * mapWidth,
              point.y * mapHeight,
            ],
            []
          )}
          closed={true}
          {...defaultProps}
          {...props}
        />
      );
    } else if (drawing.shapeType === "line") {
      return (
        <Line
          points={drawing.data.points.reduce(
            (acc: number[], point) => [
              ...acc,
              point.x * mapWidth,
              point.y * mapHeight,
            ],
            []
          )}
          stroke={colors[drawing.color] || drawing.color}
          lineCap="round"
          {...defaultProps}
        />
      );
    }
  }

  return null;
}

export default Drawing;