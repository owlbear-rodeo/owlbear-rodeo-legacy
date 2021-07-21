import { useState, useEffect } from "react";
import { Group } from "react-konva";

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
import {
  getRelativePointerPosition,
  scaleAndFlattenPoints,
} from "../../helpers/konva";
import { Intersection } from "../../helpers/token";

import {
  Selection as SelectionType,
  SelectionItem,
  SelectToolSettings,
} from "../../types/Select";
import { RectData } from "../../types/Drawing";
import { useGridCellNormalizedSize } from "../../contexts/GridContext";
import Konva from "konva";
import Selection from "../konva/Selection";
import { SelectionItemsChangeEventHandler } from "../../types/Events";

type MapSelectProps = {
  active: boolean;
  toolSettings: SelectToolSettings;
  onSelectionItemsChange: SelectionItemsChangeEventHandler;
};

function SelectTool({
  active,
  toolSettings,
  onSelectionItemsChange,
}: MapSelectProps) {
  const stageScale = useDebouncedStageScale();
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const interactionEmitter = useInteractionEmitter();

  const gridCellNormalizedSize = useGridCellNormalizedSize();

  const mapStageRef = useMapStage();
  const [selection, setSelection] = useState<SelectionType | null>(null);
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
      if (!brushPosition || selection) {
        return;
      }
      if (toolSettings.type === "path") {
        setSelection({
          type: "path",
          items: [],
          data: { points: [brushPosition] },
          x: 0,
          y: 0,
        });
      } else {
        setSelection({
          type: "rectangle",
          items: [],
          data: getDefaultShapeData("rectangle", brushPosition) as RectData,
          x: 0,
          y: 0,
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
      if (selection && mapStage) {
        const tokensGroup = mapStage.findOne<Konva.Group>("#tokens");
        const notesGroup = mapStage.findOne<Konva.Group>("#notes");
        if (tokensGroup && notesGroup) {
          let points: Vector2[] = [];
          if (selection.type === "path") {
            points = selection.data.points;
          } else {
            points.push({ x: selection.data.x, y: selection.data.y });
            points.push({
              x: selection.data.x + selection.data.width,
              y: selection.data.y,
            });
            points.push({
              x: selection.data.x + selection.data.width,
              y: selection.data.y + selection.data.height,
            });
            points.push({
              x: selection.data.x,
              y: selection.data.y + selection.data.height,
            });
          }
          const intersection = new Intersection(
            {
              type: "path",
              points: scaleAndFlattenPoints(points, {
                x: mapWidth,
                y: mapHeight,
              }),
            },
            { x: selection.x, y: selection.y },
            { x: 0, y: 0 },
            0
          );

          let intersectingItems: SelectionItem[] = [];

          const tokens = tokensGroup.children;
          if (tokens) {
            for (let token of tokens) {
              if (intersection.intersects(token.position())) {
                intersectingItems.push({ type: "token", id: token.id() });
              }
            }
          }
          const notes = notesGroup.children;
          if (notes) {
            for (let note of notes) {
              if (intersection.intersects(note.position())) {
                intersectingItems.push({ type: "note", id: note.id() });
              }
            }
          }

          if (intersectingItems.length > 0) {
            setSelection((prevSelection) => {
              if (!prevSelection) {
                return prevSelection;
              }
              return { ...prevSelection, items: intersectingItems };
            });
          } else {
            setSelection(null);
          }
        } else {
          setSelection(null);
        }
      } else {
        setSelection(null);
      }

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

  return (
    <Group>
      {selection && (
        <Selection
          selection={selection}
          onSelectionChange={setSelection}
          onSelectionItemsChange={onSelectionItemsChange}
        />
      )}
    </Group>
  );
}

export default SelectTool;
