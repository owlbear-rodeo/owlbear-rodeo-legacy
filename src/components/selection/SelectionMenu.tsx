import { useEffect, useRef, useState } from "react";
import { Box, Flex, IconButton } from "theme-ui";
import { useToasts } from "react-toast-notifications";
import { v4 as uuid } from "uuid";

import MapMenu from "../map/MapMenu";

import usePrevious from "../../hooks/usePrevious";

import LockIcon from "../../icons/TokenLockIcon";
import UnlockIcon from "../../icons/TokenUnlockIcon";
import ShowIcon from "../../icons/TokenShowIcon";
import HideIcon from "../../icons/TokenHideIcon";
import CopyIcon from "../../icons/CopyIcon";
import PasteIcon from "../../icons/PasteIcon";

import { useUserId } from "../../contexts/UserIdContext";

import {
  SelectionItemsChangeEventHandler,
  RequestCloseEventHandler,
  SelectionItemsCreateEventHandler,
} from "../../types/Events";
import { Map } from "../../types/Map";
import { Selection, SelectionItem } from "../../types/Select";
import { TokenState, TokenStates } from "../../types/TokenState";
import { Note, Notes } from "../../types/Note";
import { getSelectionPoints } from "../../helpers/selection";
import Vector2 from "../../helpers/Vector2";
import { useMapStage } from "../../contexts/MapStageContext";
import { MapState } from "../../types/MapState";
import { isMapState } from "../../validators/MapState";
import { isSelection } from "../../validators/Selection";
import { getRelativePointerPosition } from "../../helpers/konva";

type SelectionMenuProps = {
  isOpen: boolean;
  active: boolean;
  onRequestClose: RequestCloseEventHandler;
  onRequestOpen: () => void;
  selection: Selection | null;
  onSelectionChange: React.Dispatch<React.SetStateAction<Selection | null>>;
  onSelectionItemsChange: SelectionItemsChangeEventHandler;
  onSelectionItemsCreate: SelectionItemsCreateEventHandler;
  map: Map | null;
  mapState: MapState | null;
};

function SelectionMenu({
  isOpen,
  active,
  onRequestClose,
  onRequestOpen,
  selection,
  onSelectionChange,
  onSelectionItemsChange,
  onSelectionItemsCreate,
  map,
  mapState,
}: SelectionMenuProps) {
  const { addToast } = useToasts();

  const userId = useUserId();

  const wasOpen = usePrevious(isOpen);

  const mapStageRef = useMapStage();

  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);

  const selectionMenuWidth = selection === null ? 48 : 156;

  useEffect(() => {
    const mapStage = mapStageRef.current;
    if (isOpen && !wasOpen && mapStage) {
      const mapImage = mapStage.findOne("#mapImage");
      if (!mapImage) {
        return;
      }
      let menuPosition = { x: 0, y: 0 };
      if (selection) {
        const points = getSelectionPoints(selection);
        const bounds = Vector2.getBoundingBox(points);

        menuPosition = new Vector2(
          bounds.center.x + selection.x,
          bounds.max.y + selection.y
        );
        menuPosition = Vector2.multiply(menuPosition, {
          x: mapImage.width(),
          y: mapImage.height(),
        });
      } else {
        const position = getRelativePointerPosition(mapImage);
        if (position) {
          menuPosition = position;
        }
      }

      const transform = mapImage.getAbsoluteTransform().copy();
      const absolutePosition = transform.point(menuPosition);
      const mapElement = document.querySelector(".map");
      if (mapElement) {
        const mapRect = mapElement.getBoundingClientRect();
        setMenuLeft(mapRect.left + absolutePosition.x - selectionMenuWidth / 2);
        setMenuTop(mapRect.top + absolutePosition.y + 12);
      }
    }
  }, [isOpen, selection, wasOpen, mapStageRef, selectionMenuWidth]);

  // Open paste menu if clicking without a selection
  // Ensure that paste menu is closed when clicking and that the click hasn't moved far
  const openOnDownRef = useRef(false);
  const downPositionRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!active) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      openOnDownRef.current = isOpen || !!selection;
      downPositionRef.current = { x: event.clientX, y: event.clientY };
    }
    function handleMapElementClick(event: MouseEvent) {
      const deltaPosition = Vector2.distance(
        { x: event.clientX, y: event.clientY },
        downPositionRef.current
      );
      if (
        !openOnDownRef.current &&
        !selection &&
        deltaPosition < 10 &&
        event.target instanceof HTMLCanvasElement
      ) {
        onRequestOpen();
      }
    }
    const mapElement = document.querySelector<HTMLElement>(".map");
    mapElement?.addEventListener("pointerdown", handlePointerDown);
    mapElement?.addEventListener("click", handleMapElementClick);

    return () => {
      mapElement?.removeEventListener("pointerdown", handlePointerDown);
      mapElement?.removeEventListener("click", handleMapElementClick);
    };
  }, [isOpen, active, selection, onRequestOpen]);

  function handleModalContent(node: HTMLElement) {
    if (node) {
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

  // Update lock and visible state depending on selected items
  useEffect(() => {
    if (isOpen && selection && mapState) {
      let allVisible = true;
      let allLocked = true;
      for (let item of selection.items) {
        if (item.type === "token") {
          const tokenState = mapState.tokens[item.id];
          if (!tokenState.visible) {
            allVisible = false;
          }
          if (!tokenState.locked) {
            allLocked = false;
          }
        } else {
          const note = mapState.notes[item.id];
          if (!note.visible) {
            allVisible = false;
          }
          if (!note.locked) {
            allLocked = false;
          }
        }
      }
      setItemsVisible(allVisible);
      setItemsLocked(allLocked);
    }
  }, [mapState, selection, isOpen]);

  function addSuccessToast(
    message: string,
    tokens?: TokenStates,
    notes?: Notes
  ) {
    const numTokens = tokens ? Object.keys(tokens).length : 0;
    const numNotes = notes ? Object.keys(notes).length : 0;
    const tokenText = `${numTokens} token${numTokens > 1 ? "s" : ""}`;
    const noteText = `${numNotes} note${numNotes > 1 ? "s" : ""}`;
    if (numTokens > 0 && numNotes > 0) {
      addToast(`${message} ${tokenText} and ${noteText}`);
    } else if (numTokens > 0) {
      addToast(`${message} ${tokenText}`);
    } else if (numNotes > 0) {
      addToast(`${message} ${noteText}`);
    }
  }

  async function handleCopy() {
    let version = process.env.REACT_APP_VERSION;
    if (!version || !selection || !mapState) {
      return;
    }
    let clipboard: { version: string; data: MapState; selection: Selection } = {
      version,
      selection,
      data: {
        tokens: {},
        notes: {},
        drawShapes: {},
        editFlags: [],
        fogShapes: {},
        mapId: mapState.mapId,
      },
    };
    for (let item of selection.items) {
      if (item.type === "token" && clipboard.data.tokens) {
        clipboard.data.tokens[item.id] = mapState.tokens[item.id];
      } else if (item.type === "note" && clipboard.data.notes) {
        clipboard.data.notes[item.id] = mapState.notes[item.id];
      }
    }
    await navigator.clipboard.writeText(JSON.stringify(clipboard));
    addSuccessToast("Copied", clipboard.data.tokens, clipboard.data.notes);
  }

  async function handlePaste() {
    let version = process.env.REACT_APP_VERSION;

    if (!version || !mapState) {
      return;
    }
    try {
      const clipboardText = await navigator.clipboard.readText();
      const clipboard = JSON.parse(clipboardText);
      if (
        clipboard.version === version &&
        isMapState(clipboard.data) &&
        isSelection(clipboard.selection)
      ) {
        // Find new selection position
        const mapStage = mapStageRef.current;
        const mapImage = mapStage?.findOne("#mapImage");
        if (!mapImage) {
          return;
        }
        const position = getRelativePointerPosition(mapImage);
        if (!position) {
          return;
        }
        const normalizedPosition = Vector2.divide(position, {
          x: mapImage.width(),
          y: mapImage.height(),
        });

        const clipboardSelection = clipboard.selection as Selection;
        const points = getSelectionPoints(clipboardSelection);
        const center = Vector2.centroid(points);

        let selectionDelta = Vector2.subtract(normalizedPosition, center);

        const clipboardState = clipboard.data as MapState;
        let tokenStates: TokenState[] = [];
        let notes: Note[] = [];
        let selectionItems: SelectionItem[] = [];
        for (let token of Object.values(clipboardState.tokens)) {
          const newId = uuid();
          tokenStates.push({
            ...token,
            x: token.x + selectionDelta.x,
            y: token.y + selectionDelta.y,
            id: newId,
          });
          selectionItems.push({ id: newId, type: "token" });
        }
        for (let note of Object.values(clipboardState.notes)) {
          const newId = uuid();
          notes.push({
            ...note,
            x: note.x + selectionDelta.x,
            y: note.y + selectionDelta.y,
            id: newId,
          });
          selectionItems.push({ id: newId, type: "note" });
        }
        onSelectionItemsCreate(tokenStates, notes);

        onSelectionChange({
          ...clipboardSelection,
          items: selectionItems,
          x: clipboardSelection.x + selectionDelta.x,
          y: clipboardSelection.y + selectionDelta.y,
        });

        onRequestClose();

        addSuccessToast("Pasted", clipboard.data.tokens, clipboard.data.notes);
      } else {
        addToast("Invalid data");
      }
    } catch {
      addToast("Unable to paste");
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
      <Box sx={{ width: `${selectionMenuWidth}px`, overflow: "hidden" }} p={1}>
        <Flex sx={{ alignItems: "center", justifyContent: "space-around" }}>
          {selection ? (
            <>
              {/* Only show hide and lock token actions to map owners */}
              {map && map.owner === userId && (
                <>
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
                </>
              )}
              <IconButton
                title="Copy Items"
                aria-label="Copy Items"
                onClick={handleCopy}
              >
                <CopyIcon />
              </IconButton>
            </>
          ) : (
            <IconButton
              title="Paste Items"
              aria-label="Paste Items"
              onClick={handlePaste}
            >
              <PasteIcon />
            </IconButton>
          )}
        </Flex>
      </Box>
    </MapMenu>
  );
}

export default SelectionMenu;
