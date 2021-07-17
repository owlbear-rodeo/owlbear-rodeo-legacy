import { Rect, Circle, Line } from "react-konva";

import colors from "../../helpers/colors";
import { Outline } from "../../types/Outline";

type TokenOutlineSVGProps = {
  outline: Outline;
  width: number;
  height: number;
};

export function TokenOutlineSVG({
  outline,
  width,
  height,
}: TokenOutlineSVGProps) {
  if (outline.type === "rect") {
    return (
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        fill="rgba(0, 0, 0, 0.3)"
        viewBox={`0, 0, ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <rect
          x={outline.x}
          y={outline.y}
          width={outline.width}
          height={outline.height}
        />
      </svg>
    );
  } else if (outline.type === "circle") {
    return (
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        fill="rgba(0, 0, 0, 0.3)"
        viewBox={`0, 0, ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <circle r={outline.radius} cx={outline.x} cy={outline.y} />
      </svg>
    );
  } else {
    let points = [];
    for (let i = 0; i < outline.points.length; i += 2) {
      points.push(`${outline.points[i]}, ${outline.points[i + 1]}`);
    }
    return (
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        fill="rgba(0, 0, 0, 0.3)"
        viewBox={`0, 0, ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <polygon points={points.join(" ")} />
      </svg>
    );
  }
}

type TokenOutlineProps = {
  outline: Outline;
  hidden: boolean;
};

function TokenOutline({ outline, hidden }: TokenOutlineProps) {
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
      />
    );
  } else if (outline.type === "circle") {
    return (
      <Circle
        radius={outline.radius}
        x={outline.x}
        y={outline.y}
        {...sharedProps}
      />
    );
  } else {
    return (
      <Line
        points={outline.points}
        closed
        tension={outline.points.length < 200 ? 0 : 0.33}
        {...sharedProps}
      />
    );
  }
}

export default TokenOutline;
