import React, { useEffect, useState, useContext } from "react";
import { Box, Flex, Text, IconButton, Textarea } from "theme-ui";

import Slider from "../Slider";

import MapMenu from "../map/MapMenu";

import colors, { colorOptions } from "../../helpers/colors";

import usePrevious from "../../hooks/usePrevious";

import LockIcon from "../../icons/TokenLockIcon";
import UnlockIcon from "../../icons/TokenUnlockIcon";
import ShowIcon from "../../icons/TokenShowIcon";
import HideIcon from "../../icons/TokenHideIcon";
import NoteIcon from "../../icons/NoteToolIcon";
import TextIcon from "../../icons/NoteTextIcon";

import AuthContext from "../../contexts/AuthContext";

const defaultNoteMaxSize = 6;

function NoteMenu({
  isOpen,
  onRequestClose,
  note,
  noteNode,
  onNoteChange,
  map,
}) {
  const { userId } = useContext(AuthContext);

  const wasOpen = usePrevious(isOpen);

  const [noteMaxSize, setNoteMaxSize] = useState(defaultNoteMaxSize);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);
  useEffect(() => {
    if (isOpen && !wasOpen && note) {
      setNoteMaxSize(Math.max(note.size, defaultNoteMaxSize));
      // Update menu position
      if (noteNode) {
        const nodeRect = noteNode.getClientRect();
        const mapElement = document.querySelector(".map");
        const mapRect = mapElement.getBoundingClientRect();

        // Center X for the menu which is 156px wide
        setMenuLeft(mapRect.left + nodeRect.x + nodeRect.width / 2 - 156 / 2);
        // Y 12px from the bottom
        setMenuTop(mapRect.top + nodeRect.y + nodeRect.height + 12);
      }
    }
  }, [isOpen, note, wasOpen, noteNode]);

  function handleTextChange(event) {
    const text = event.target.value.substring(0, 144);
    note && onNoteChange({ ...note, text: text });
  }

  function handleColorChange(color) {
    if (!note) {
      return;
    }
    onNoteChange({ ...note, color: color });
  }

  function handleSizeChange(event) {
    const newSize = parseFloat(event.target.value);
    note && onNoteChange({ ...note, size: newSize });
  }

  function handleVisibleChange() {
    note && onNoteChange({ ...note, visible: !note.visible });
  }

  function handleLockChange() {
    note && onNoteChange({ ...note, locked: !note.locked });
  }

  function handleModeChange() {
    note && onNoteChange({ ...note, textOnly: !note.textOnly });
  }

  function handleModalContent(node) {
    if (node) {
      // Focus input
      const tokenLabelInput = node.querySelector("#changeNoteText");
      tokenLabelInput.focus();
      tokenLabelInput.select();

      // Ensure menu is in bounds
      const nodeRect = node.getBoundingClientRect();
      const mapElement = document.querySelector(".map");
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

  function handleTextKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onRequestClose();
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
        <Flex
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            onRequestClose();
          }}
          sx={{ alignItems: "center" }}
        >
          <Textarea
            id="changeNoteText"
            onChange={handleTextChange}
            value={(note && note.text) || ""}
            sx={{
              padding: "4px",
              border: "none",
              ":focus": {
                outline: "none",
              },
              resize: "none",
            }}
            rows={1}
            onKeyPress={handleTextKeyPress}
          />
        </Flex>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {colorOptions.map((color) => (
            <Box
              key={color}
              sx={{
                width: "16.66%",
                paddingTop: "16.66%",
                borderRadius: "50%",
                transform: "scale(0.75)",
                backgroundColor: colors[color],
                cursor: "pointer",
              }}
              onClick={() => handleColorChange(color)}
              aria-label={`Note label Color ${color}`}
            >
              {note && note.color === color && (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    border: "2px solid white",
                    position: "absolute",
                    top: 0,
                    borderRadius: "50%",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
        <Flex sx={{ alignItems: "center" }}>
          <Text
            as="label"
            variant="body2"
            sx={{ width: "40%", fontSize: "16px" }}
            p={1}
          >
            Size:
          </Text>
          <Slider
            value={(note && note.size) || 1}
            onChange={handleSizeChange}
            step={0.5}
            min={0.5}
            max={noteMaxSize}
            mr={1}
          />
        </Flex>
        {/* Only show hide and lock token actions to map owners */}
        {map && map.owner === userId && (
          <Flex sx={{ alignItems: "center", justifyContent: "space-around" }}>
            <IconButton
              onClick={handleVisibleChange}
              title={note && note.visible ? "Hide Note" : "Show Note"}
              aria-label={note && note.visible ? "Hide Note" : "Show Note"}
            >
              {note && note.visible ? <ShowIcon /> : <HideIcon />}
            </IconButton>
            <IconButton
              onClick={handleLockChange}
              title={note && note.locked ? "Unlock Note" : "Lock Note"}
              aria-label={note && note.locked ? "Unlock Note" : "Lock Note"}
            >
              {note && note.locked ? <LockIcon /> : <UnlockIcon />}
            </IconButton>
            <IconButton
              onClick={handleModeChange}
              title={note && note.textOnly ? "Note Mode" : "Text Mode"}
              aria-label={note && note.textOnly ? "Note Mode" : "Text Mode"}
            >
              {note && note.textOnly ? <TextIcon /> : <NoteIcon />}
            </IconButton>
          </Flex>
        )}
      </Box>
    </MapMenu>
  );
}

export default NoteMenu;
