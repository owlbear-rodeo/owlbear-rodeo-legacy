import React from "react";
import { Circle, Group } from "react-konva";

import colors from "../../helpers/colors";

function TokenStatus({ tokenState, width, height }) {
  return (
    <Group x={width} y={height} offsetX={width / 2} offsetY={height / 2}>
      {tokenState.statuses.map((status, index) => (
        <Circle
          width={width}
          height={height}
          stroke={colors[status]}
          strokeWidth={width / 20 / tokenState.size}
          scaleX={1 - index / 10 / tokenState.size}
          scaleY={1 - index / 10 / tokenState.size}
          opacity={0.8}
        />
      ))}
    </Group>
  );
}

export default TokenStatus;
