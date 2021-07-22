import { useEffect, useState } from "react";
import { Box, Flex, IconButton } from "theme-ui";

import MapMenu from "../map/MapMenu";

import usePrevious from "../../hooks/usePrevious";

import LockIcon from "../../icons/TokenLockIcon";
import UnlockIcon from "../../icons/TokenUnlockIcon";
import ShowIcon from "../../icons/TokenShowIcon";
import HideIcon from "../../icons/TokenHideIcon";

import { useUserId } from "../../contexts/UserIdContext";

import {
  SelectionItemsChangeEventHandler,
  RequestCloseEventHandler,
} from "../../types/Events";
import { Map } from "../../types/Map";
import { Selection } from "../../types/Select";
import { TokenState } from "../../types/TokenState";
import { Note } from "../../types/Note";
import { getSelectionPoints } from "../../helpers/selection";
import Vector2 from "../../helpers/Vector2";
import { useMapStage } from "../../contexts/MapStageContext";

type SelectionMenuProps = {
  isOpen: boolean;
  onRequestClose: RequestCloseEventHandler;
  selection: Selection | null;
  onSelectionItemsChange: SelectionItemsChangeEventHandler;
  map: Map | null;
};

function SelectionMenu({
  isOpen,
  onRequestClose,
  selection,
  onSelectionItemsChange,
  map,
}: SelectionMenuProps) {
  const userId = useUserId();

  const wasOpen = usePrevious(isOpen);

  const mapStageRef = useMapStage();

  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);
  useEffect(() => {
    const mapStage = mapStageRef.current;
    if (isOpen && !wasOpen && selection && mapStage) {
      const points = getSelectionPoints(selection);
      const bounds = Vector2.getBoundingBox(points);

      let menuPosition = new Vector2(bounds.center.x, bounds.max.y);
      const mapImage = mapStage.findOne("#mapImage");
      if (!mapImage) {
        return;
      }
      menuPosition = Vector2.multiply(menuPosition, {
        x: mapImage.width(),
        y: mapImage.height(),
      });

      const transform = mapImage.getAbsoluteTransform().copy();
      const absolutePosition = transform.point(menuPosition);
      const mapElement = document.querySelector(".map");
      if (mapElement) {
        const mapRect = mapElement.getBoundingClientRect();
        setMenuLeft(mapRect.left + absolutePosition.x - 156 / 2);
        setMenuTop(mapRect.top + absolutePosition.y + 12);
      }
    }
  }, [isOpen, selection, wasOpen, mapStageRef]);

  function updateSelectedItems(change: Partial<TokenState> | Partial<Note>) {
    if (selection) {
      const tokenChanges: Record<string, Partial<TokenState>> = {};
      const noteChanges: Record<string, Partial<Note>> = {};
      for (let item of selection.items) {
        if (item.type === "token") {
          tokenChanges[item.id] = change;
        } else {
          noteChanges[item.id] = change;
        }
      }
      onSelectionItemsChange(tokenChanges, noteChanges);
    }
  }

  const [itemsVisible, setItemsVisible] = useState(false);
  function handleVisibleChange() {
    updateSelectedItems({ visible: !itemsVisible });
    setItemsVisible(!itemsVisible);
  }

  const [itemsLocked, setItemsLocked] = useState(false);
  function handleLockChange() {
    updateSelectedItems({ locked: !itemsLocked });
    setItemsLocked(!itemsLocked);
  }

  function handleModalContent(node: HTMLElement) {
    if (node) {
      // Focus input
      const tokenLabelInput =
        node.querySelector<HTMLInputElement>("#changeNoteText");
      if (tokenLabelInput) {
        tokenLabelInput.focus();
        tokenLabelInput.select();
      }

      // Ensure menu is in bounds
      const nodeRect = node.getBoundingClientRect();
      const mapElement = document.querySelector(".map");
      if (mapElement) {
        const mapRect = mapElement.getBoundingClientRect();
        setMenuLeft((prevLeft) =>
          Math.min(
            mapRect.right - nodeRect.width,
            Math.max(mapRect.left, prevLeft)
          )
        );
        setMenuTop((prevTop) =>
          Math.min(mapRect.bottom - nodeRect.height, prevTop)
        );
      }
    }
  }

  return (
    <MapMenu
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      top={`${menuTop}px`}
      left={`${menuLeft}px`}
      onModalContent={handleModalContent}
    >
      <Box sx={{ width: "156px", overflow: "hidden" }} p={1}>
        {/* Only show hide and lock token actions to map owners */}
        {map && map.owner === userId && (
          <Flex sx={{ alignItems: "center", justifyContent: "space-around" }}>
            <IconButton
              onClick={handleVisibleChange}
              title={itemsVisible ? "Hide Items" : "Show Items"}
              aria-label={itemsVisible ? "Hide Items" : "Show Items"}
            >
              {itemsVisible ? <ShowIcon /> : <HideIcon />}
            </IconButton>
            <IconButton
              onClick={handleLockChange}
              title={itemsLocked ? "Unlock Items" : "Lock Items"}
              aria-label={itemsLocked ? "Unlock Items" : "Lock Items"}
            >
              {itemsLocked ? <LockIcon /> : <UnlockIcon />}
            </IconButton>
          </Flex>
        )}
      </Box>
    </MapMenu>
  );
}

export default SelectionMenu;
