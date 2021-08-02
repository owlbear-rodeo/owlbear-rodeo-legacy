import { Group, Label, Line, Tag, Text } from "react-konva";

import { useGridStrokeWidth } from "../../contexts/GridContext";
import {
  useDebouncedStageScale,
  useMapHeight,
  useMapWidth,
} from "../../contexts/MapInteractionContext";

import { scaleAndFlattenPoints } from "../../helpers/konva";
import Vector2 from "../../helpers/Vector2";

import { GridScale } from "../../types/Grid";

type RulerProps = {
  points: Vector2[];
  scale: GridScale;
  length: number;
};

function Ruler({ points, scale, length }: RulerProps) {
  const stageScale = useDebouncedStageScale();
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const mapSize = new Vector2(mapWidth, mapHeight);

  const gridStrokeWidth = useGridStrokeWidth();

  const linePoints = scaleAndFlattenPoints(points, mapSize);

  const lineCenter = Vector2.multiply(Vector2.centroid(points), mapSize);

  return (
    <Group>
      <Line
        points={linePoints}
        strokeWidth={1.5 * gridStrokeWidth}
        stroke="hsla(230, 25%, 18%, 0.8)"
        lineCap="round"
      />
      <Line
        points={linePoints}
        strokeWidth={0.25 * gridStrokeWidth}
        stroke="white"
        lineCap="round"
      />
      <Label
        x={lineCenter.x}
        y={lineCenter.y}
        offsetX={26}
        offsetY={26}
        scaleX={1 / stageScale}
        scaleY={1 / stageScale}
      >
        <Tag fill="hsla(230, 25%, 18%, 0.8)" cornerRadius={4} />
        <Text
          text={`${(length * scale.multiplier).toFixed(scale.digits)}${
            scale.unit
          }`}
          fill="white"
          fontSize={24}
          padding={4}
        />
      </Label>
    </Group>
  );
}

export default Ruler;
