import React, { useRef, useState, useEffect } from "react";
import { Box, Button, Flex, Label, Input, Text } from "theme-ui";

import Modal from "../components/Modal";
import MapSelect from "../components/map/MapSelect";

import * as defaultMaps from "../maps";

const defaultMapSize = 22;

function AddMapModal({ isOpen, onRequestClose, onDone }) {
  const [imageLoading, setImageLoading] = useState(false);

  const [currentMap, setCurrentMap] = useState(-1);
  const [maps, setMaps] = useState(Object.values(defaultMaps));

  const [gridX, setGridX] = useState(defaultMapSize);
  const [gridY, setGridY] = useState(defaultMapSize);
  useEffect(() => {
    setMaps((prevMaps) => {
      const newMaps = [...prevMaps];
      const changedMap = newMaps[currentMap];
      if (changedMap) {
        changedMap.gridX = gridX;
        changedMap.gridY = gridY;
      }
      return newMaps;
    });
  }, [gridX, gridY, currentMap]);

  const fileInputRef = useRef();

  function handleImageUpload(file) {
    if (!file) {
      return;
    }
    let fileGridX = defaultMapSize;
    let fileGridY = defaultMapSize;
    if (file.name) {
      // Match against a regex to find the grid size in the file name
      // e.g. Cave 22x23 will return [["22x22", "22", "x", "23"]]
      const gridMatches = [...file.name.matchAll(/(\d+) ?(x|X) ?(\d+)/g)];
      if (gridMatches.length > 0) {
        const lastMatch = gridMatches[gridMatches.length - 1];
        const matchX = parseInt(lastMatch[1]);
        const matchY = parseInt(lastMatch[3]);
        if (!isNaN(matchX) && !isNaN(matchY)) {
          fileGridX = matchX;
          fileGridY = matchY;
        }
      }
    }
    const url = URL.createObjectURL(file);
    let image = new Image();
    setImageLoading(true);
    image.onload = function () {
      setMaps((prevMaps) => {
        const newMaps = [
          ...prevMaps,
          {
            file,
            gridX: fileGridX,
            gridY: fileGridY,
            width: image.width,
            height: image.height,
            source: url,
          },
        ];
        setCurrentMap(newMaps.length - 1);
        return newMaps;
      });
      setGridX(fileGridX);
      setGridY(fileGridY);
      setImageLoading(false);
    };
    image.src = url;
  }

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const [dragging, setDragging] = useState(false);
  function handleImageDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  }

  function handleImageDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  }

  function handleImageDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image")) {
      handleImageUpload(file);
    }
    setDragging(false);
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <Box
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          onDone(maps[currentMap]);
        }}
        onDragEnter={handleImageDragEnter}
      >
        <input
          onChange={(event) => handleImageUpload(event.target.files[0])}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={fileInputRef}
        />
        <Flex
          sx={{
            flexDirection: "column",
          }}
        >
          <Label pt={2} pb={1}>
            Add map
          </Label>
          <MapSelect maps={maps} onMapAdd={openImageDialog} />
          <Flex>
            <Box mb={2} mr={1} sx={{ flexGrow: 1 }}>
              <Label htmlFor="gridX">Columns</Label>
              <Input
                type="number"
                name="gridX"
                value={gridX}
                onChange={(e) => setGridX(e.target.value)}
              />
            </Box>
            <Box mb={2} ml={1} sx={{ flexGrow: 1 }}>
              <Label htmlFor="gridY">Rows</Label>
              <Input
                type="number"
                name="gridY"
                value={gridY}
                onChange={(e) => setGridY(e.target.value)}
              />
            </Box>
          </Flex>
          <Button variant="primary" disabled={imageLoading}>
            Done
          </Button>
          {dragging && (
            <Flex
              bg="muted"
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                cursor: "copy",
              }}
              onDragLeave={handleImageDragLeave}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={handleImageDrop}
            >
              <Text sx={{ pointerEvents: "none" }}>Drop map to upload</Text>
            </Flex>
          )}
        </Flex>
      </Box>
    </Modal>
  );
}

export default AddMapModal;
