import Konva from "konva";
import { Rect, Circle, Line } from "react-konva";

import colors from "../../helpers/colors";
import { Outline } from "../../types/Outline";

type TokenOutlineProps = {
  outline: Outline;
  hidden: boolean;
} & Konva.ShapeConfig;

function TokenOutline({ outline, hidden, ...props }: TokenOutlineProps) {
  const sharedProps = {
    fill: colors.black,
    opacity: hidden ? 0 : 0.8,
  };
  if (outline.type === "rect") {
    return (
      <Rect
        width={outline.width}
        height={outline.height}
        x={outline.x}
        y={outline.y}
        {...sharedProps}
        {...props}
      />
    );
  } else if (outline.type === "circle") {
    return (
      <Circle
        radius={outline.radius}
        x={outline.x}
        y={outline.y}
        {...sharedProps}
        {...props}
      />
    );
  } else {
    return (
      <Line
        points={outline.points}
        closed
        tension={outline.points.length < 200 ? 0 : 0.33}
        {...sharedProps}
        {...props}
      />
    );
  }
}

export default TokenOutline;
