import { useState, useEffect } from "react";
import { Group, Line, Rect } from "react-konva";

import {
  useDebouncedStageScale,
  useMapWidth,
  useMapHeight,
  useInteractionEmitter,
} from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";

import {
  getDefaultShapeData,
  getUpdatedShapeData,
  simplifyPoints,
} from "../../helpers/drawing";
import Vector2 from "../../helpers/Vector2";
import colors from "../../helpers/colors";
import { getRelativePointerPosition } from "../../helpers/konva";

import { Selection, SelectToolSettings } from "../../types/Select";
import { RectData } from "../../types/Drawing";
import {
  useGridCellNormalizedSize,
  useGridStrokeWidth,
} from "../../contexts/GridContext";

type MapSelectProps = {
  active: boolean;
  toolSettings: SelectToolSettings;
};

function SelectTool({ active, toolSettings }: MapSelectProps) {
  const stageScale = useDebouncedStageScale();
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const interactionEmitter = useInteractionEmitter();

  const gridCellNormalizedSize = useGridCellNormalizedSize();
  const gridStrokeWidth = useGridStrokeWidth();

  const mapStageRef = useMapStage();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isBrushDown, setIsBrushDown] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    const mapStage = mapStageRef.current;
    const mapImage = mapStage?.findOne("#mapImage");

    function getBrushPosition() {
      if (!mapImage) {
        return;
      }
      let position = getRelativePointerPosition(mapImage);
      if (!position) {
        return;
      }
      return Vector2.divide(position, {
        x: mapImage.width(),
        y: mapImage.height(),
      });
    }

    function handleBrushDown() {
      const brushPosition = getBrushPosition();
      if (!brushPosition) {
        return;
      }
      if (toolSettings.type === "path") {
        setSelection({
          type: "path",
          nodes: [],
          data: { points: [brushPosition] },
        });
      } else {
        setSelection({
          type: "rectangle",
          nodes: [],
          data: getDefaultShapeData("rectangle", brushPosition) as RectData,
        });
      }
      setIsBrushDown(true);
    }

    function handleBrushMove() {
      const brushPosition = getBrushPosition();
      if (isBrushDown && selection && brushPosition && mapImage) {
        if (selection.type === "path") {
          setSelection((prevSelection) => {
            if (prevSelection?.type !== "path") {
              return prevSelection;
            }
            const prevPoints = prevSelection.data.points;
            if (
              Vector2.compare(
                prevPoints[prevPoints.length - 1],
                brushPosition,
                0.001
              )
            ) {
              return prevSelection;
            }
            const simplified = simplifyPoints(
              [...prevPoints, brushPosition],
              1 / 1000 / stageScale
            );
            return {
              ...prevSelection,
              data: { points: simplified },
            };
          });
        } else {
          setSelection((prevSelection) => {
            if (prevSelection?.type !== "rectangle") {
              return prevSelection;
            }
            return {
              ...prevSelection,
              data: getUpdatedShapeData(
                "rectangle",
                prevSelection.data,
                brushPosition,
                gridCellNormalizedSize,
                mapWidth,
                mapHeight
              ) as RectData,
            };
          });
        }
      }
    }

    function handleBrushUp() {
      setSelection(null);
      setIsBrushDown(false);
    }

    interactionEmitter?.on("dragStart", handleBrushDown);
    interactionEmitter?.on("drag", handleBrushMove);
    interactionEmitter?.on("dragEnd", handleBrushUp);

    return () => {
      interactionEmitter?.off("dragStart", handleBrushDown);
      interactionEmitter?.off("drag", handleBrushMove);
      interactionEmitter?.off("dragEnd", handleBrushUp);
    };
  });

  function renderSelection(selection: Selection) {
    const strokeWidth = gridStrokeWidth / stageScale;
    const defaultProps = {
      stroke: colors.primary,
      strokeWidth: strokeWidth,
      dash: [strokeWidth / 2, strokeWidth * 2],
    };
    if (selection.type === "path") {
      return (
        <Line
          points={selection.data.points.reduce(
            (acc: number[], point) => [
              ...acc,
              point.x * mapWidth,
              point.y * mapHeight,
            ],
            []
          )}
          tension={0.5}
          closed={false}
          lineCap="round"
          lineJoin="round"
          {...defaultProps}
        />
      );
    } else if (selection.type === "rectangle") {
      return (
        <Rect
          x={selection.data.x * mapWidth}
          y={selection.data.y * mapHeight}
          width={selection.data.width * mapWidth}
          height={selection.data.height * mapHeight}
          lineCap="round"
          lineJoin="round"
          {...defaultProps}
        />
      );
    }
  }

  return <Group>{selection && renderSelection(selection)}</Group>;
}

export default SelectTool;
