import React, { useRef, useState, useEffect } from "react";
import { Box, Button, Flex, Label, Input, Text } from "theme-ui";
import shortid from "shortid";

import db from "../database";

import Modal from "../components/Modal";
import MapTiles from "../components/map/MapTiles";

import * as defaultMaps from "../maps";

const defaultMapSize = 22;
const defaultMapState = {
  tokens: {},
  // An index into the draw actions array to which only actions before the
  // index will be performed (used in undo and redo)
  drawActionIndex: -1,
  drawActions: [],
};

function SelectMapModal({ isOpen, onRequestClose, onDone }) {
  const [imageLoading, setImageLoading] = useState(false);

  const [currentMap, setCurrentMap] = useState(null);
  const [maps, setMaps] = useState(Object.values(defaultMaps));
  // Load maps from the database
  useEffect(() => {
    async function loadMaps() {
      let storedMaps = await db.table("maps").toArray();
      // reverse so maps are show in the order they were added
      storedMaps.reverse();
      for (let map of storedMaps) {
        // Recreate image urls for each map
        map.source = URL.createObjectURL(map.file);
      }
      setMaps((prevMaps) => [...storedMaps, ...prevMaps]);
    }
    loadMaps();
  }, []);

  const [gridX, setGridX] = useState(defaultMapSize);
  const [gridY, setGridY] = useState(defaultMapSize);
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
      handleMapAdd({
        file,
        gridX: fileGridX,
        gridY: fileGridY,
        width: image.width,
        height: image.height,
        source: url,
        id: shortid.generate(),
      });
      setImageLoading(false);
    };
    image.src = url;
  }

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleMapAdd(map) {
    await db.table("maps").add(map);
    await db.table("states").add({ ...defaultMapState, mapId: map.id });
    setMaps((prevMaps) => [map, ...prevMaps]);
    setCurrentMap(map);
    setGridX(map.gridX);
    setGridY(map.gridY);
  }

  async function handleMapRemove(id) {
    await db.table("maps").delete(id);
    await db.table("states").delete(id);
    setMaps((prevMaps) => {
      const filtered = prevMaps.filter((map) => map.id !== id);
      setCurrentMap(filtered[0]);
      return filtered;
    });
  }

  function handleMapSelect(map) {
    setCurrentMap(map);
    setGridX(map.gridX);
    setGridY(map.gridY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (currentMap) {
      let currentMapState =
        (await db.table("states").get(currentMap.id)) || defaultMapState;
      onDone(currentMap, currentMapState);
    }
    onDone(null, null);
  }

  async function handleGridXChange(e) {
    const newX = e.target.value;
    await db.table("maps").update(currentMap.id, { gridX: newX });
    setGridX(newX);
    setMaps((prevMaps) => {
      const newMaps = [...prevMaps];
      const i = newMaps.findIndex((map) => map.id === currentMap.id);
      if (i > -1) {
        newMaps[i].gridX = newX;
      }
      return newMaps;
    });
  }

  async function handleGridYChange(e) {
    const newY = e.target.value;
    await db.table("maps").update(currentMap.id, { gridY: newY });
    setGridY(newY);
    setMaps((prevMaps) => {
      const newMaps = [...prevMaps];
      const i = newMaps.findIndex((map) => map.id === currentMap.id);
      if (i > -1) {
        newMaps[i].gridY = newY;
      }
      return newMaps;
    });
  }

  /**
   * Drag and Drop
   */
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
      <Box as="form" onSubmit={handleSubmit} onDragEnter={handleImageDragEnter}>
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
            Select or import a map
          </Label>
          <MapTiles
            maps={maps}
            onMapAdd={openImageDialog}
            onMapRemove={handleMapRemove}
            selectedMap={currentMap && currentMap.id}
            onMapSelect={handleMapSelect}
          />
          <Flex>
            <Box mb={2} mr={1} sx={{ flexGrow: 1 }}>
              <Label htmlFor="gridX">Columns</Label>
              <Input
                type="number"
                name="gridX"
                value={gridX}
                onChange={handleGridXChange}
                disabled={currentMap === null || currentMap.default}
                min={1}
              />
            </Box>
            <Box mb={2} ml={1} sx={{ flexGrow: 1 }}>
              <Label htmlFor="gridY">Rows</Label>
              <Input
                type="number"
                name="gridY"
                value={gridY}
                onChange={handleGridYChange}
                disabled={currentMap === null || currentMap.default}
                min={1}
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

export default SelectMapModal;
