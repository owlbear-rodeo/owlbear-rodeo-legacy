import { Group, Rect } from "react-konva";
import useImage from "use-image";

import Vector2 from "../../helpers/Vector2";

import {
  useGrid,
  useGridPixelSize,
  useGridOffset,
  useGridCellPixelSize,
} from "../../contexts/GridContext";

import squarePatternDark from "../../images/SquarePatternDark.png";
import squarePatternLight from "../../images/SquarePatternLight.png";
import hexPatternDark from "../../images/HexPatternDark.png";
import hexPatternLight from "../../images/HexPatternLight.png";

function Grid({ stroke }: { stroke: "black" | "white" }) {
  const grid = useGrid();
  const gridPixelSize = useGridPixelSize();
  const gridOffset = useGridOffset();
  const gridCellPixelSize = useGridCellPixelSize();

  let imageSource;
  if (grid.type === "square") {
    if (stroke === "black") {
      imageSource = squarePatternDark;
    } else {
      imageSource = squarePatternLight;
    }
  } else {
    if (stroke === "black") {
      imageSource = hexPatternDark;
    } else {
      imageSource = hexPatternLight;
    }
  }

  const [patternImage] = useImage(imageSource);

  if (!grid?.size.x || !grid?.size.y) {
    return null;
  }

  const negativeGridOffset = Vector2.multiply(gridOffset, -1);

  let patternProps: Record<any, any> = {};
  if (grid.type === "square") {
    // Square grid pattern is 150 DPI
    const scale = gridCellPixelSize.width / 300;
    if (scale > 0) {
      patternProps.fillPatternScaleX = scale;
      patternProps.fillPatternScaleY = scale;
      patternProps.fillPatternOffsetX = gridCellPixelSize.width / scale / 2;
      patternProps.fillPatternOffsetY = gridCellPixelSize.height / scale / 2;
    }
  } else if (grid.type === "hexVertical") {
    // Hex tile pattern is 153 DPI to better fit hex tiles
    const scale = gridCellPixelSize.width / 153;
    if (scale > 0) {
      patternProps.fillPatternScaleX = scale;
      patternProps.fillPatternScaleY = scale;
      patternProps.fillPatternOffsetY = gridCellPixelSize.radius / scale / 2;
    }
  } else if (grid.type === "hexHorizontal") {
    const scale = gridCellPixelSize.height / 153;
    if (scale > 0) {
      patternProps.fillPatternScaleX = scale;
      patternProps.fillPatternScaleY = scale;
      patternProps.fillPatternOffsetY = -gridCellPixelSize.radius / scale / 2;
      patternProps.fillPatternRotation = 90;
    }
  }

  return (
    <Group>
      <Rect
        width={gridPixelSize.width}
        height={gridPixelSize.height}
        offset={negativeGridOffset}
        fillPatternImage={patternImage}
        fillPatternRepeat="repeat"
        opacity={stroke === "black" ? 0.8 : 0.4}
        {...patternProps}
      />
    </Group>
  );
}

Grid.defaultProps = {
  strokeWidth: 0.1,
  stroke: "white",
};

export default Grid;
