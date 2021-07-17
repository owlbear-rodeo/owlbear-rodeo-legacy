import { Circle, Group } from "react-konva";

import colors from "../../helpers/colors";
import { TokenState } from "../../types/TokenState";

type TokenStatusProps = {
  tokenState: TokenState;
  width: number;
  height: number;
};

function TokenStatus({ tokenState, width, height }: TokenStatusProps) {
  // Ensure statuses is an array and filter empty values
  const statuses = [...new Set((tokenState?.statuses || []).filter((s) => s))];
  return (
    <Group x={width} y={height} offsetX={width / 2} offsetY={height / 2}>
      {statuses.map((status, index) => (
        <Circle
          key={status}
          width={width}
          height={height}
          stroke={colors[status]}
          strokeWidth={width / 20 / tokenState.size}
          scaleX={1 - index / 10 / tokenState.size}
          scaleY={1 - index / 10 / tokenState.size}
          opacity={0.8}
          fillEnabled={false}
        />
      ))}
    </Group>
  );
}

export default TokenStatus;
