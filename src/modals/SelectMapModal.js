import React, { useRef, useState, useEffect } from "react";
import { Box, Button, Flex, Label, Input, Text } from "theme-ui";
import shortid from "shortid";

import db from "../database";

import Modal from "../components/Modal";
import MapTiles from "../components/map/MapTiles";

import { maps as defaultMaps } from "../maps";

const defaultMapSize = 22;
const defaultMapState = {
  tokens: {},
  // An index into the draw actions array to which only actions before the
  // index will be performed (used in undo and redo)
  drawActionIndex: -1,
  drawActions: [],
};

function SelectMapModal({
  isOpen,
  onRequestClose,
  onDone,
  onMapChange,
  onMapStateChange,
  // The map currently being view in the map screen
  currentMap,
}) {
  const [imageLoading, setImageLoading] = useState(false);

  // The map selected in the modal
  const [selectedMap, setSelectedMap] = useState(null);
  const [maps, setMaps] = useState([]);
  // Load maps from the database and ensure state is properly setup
  useEffect(() => {
    async function loadDefaultMaps() {
      const defaultMapsWithIds = [];
      const defaultMapStates = [];
      // Reverse maps to ensure the blank map is first in the list
      const sortedMaps = [...defaultMaps].reverse();
      for (let i = 0; i < sortedMaps.length; i++) {
        const defaultMap = sortedMaps[i];
        const id = `__default_${defaultMap.name}--${shortid.generate()}`;
        defaultMapsWithIds.push({
          ...defaultMap,
          id,
          // Emulate the time increasing to avoid sort errors
          timestamp: Date.now() + i,
        });
        defaultMapStates.push({ ...defaultMapState, mapId: id });
      }
      await db.table("maps").bulkAdd(defaultMapsWithIds);
      await db.table("states").bulkAdd(defaultMapStates);
      setMaps(defaultMapsWithIds.sort((a, b) => b.timestamp - a.timestamp));
    }

    async function loadMaps() {
      let storedMaps = await db.table("maps").toArray();

      // If we have no stored maps load the default maps
      if (storedMaps.length === 0) {
        loadDefaultMaps();
      } else {
        // Sort maps by the time they were added
        storedMaps.sort((a, b) => b.timestamp - a.timestamp);
        setMaps(storedMaps);
      }
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
    let image = new Image();
    setImageLoading(true);
    // Create and load the image temporarily to get its dimensions
    const url = URL.createObjectURL(file);
    image.onload = function () {
      handleMapAdd({
        file,
        type: "file",
        gridX: fileGridX,
        gridY: fileGridY,
        width: image.width,
        height: image.height,
        id: shortid.generate(),
        timestamp: Date.now(),
      });
      setImageLoading(false);
      URL.revokeObjectURL(url);
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
    setSelectedMap(map);
    setGridX(map.gridX);
    setGridY(map.gridY);
  }

  async function handleMapRemove(id) {
    await db.table("maps").delete(id);
    await db.table("states").delete(id);
    setMaps((prevMaps) => {
      const filtered = prevMaps.filter((map) => map.id !== id);
      setSelectedMap(filtered[0]);
      return filtered;
    });
    // Removed the map from the map screen if needed
    if (currentMap && currentMap.id === selectedMap.id) {
      onMapChange(null, null);
    }
  }

  function handleMapSelect(map) {
    setSelectedMap(map);
    setGridX(map.gridX);
    setGridY(map.gridY);
  }

  async function handleMapReset(id) {
    const state = { ...defaultMapState, mapId: id };
    await db.table("states").put(state);
    // Reset the state of the current map if needed
    if (currentMap && currentMap.id === selectedMap.id) {
      onMapStateChange(state);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedMap) {
      let currentMapState =
        (await db.table("states").get(selectedMap.id)) || defaultMapState;
      onMapChange(selectedMap, currentMapState);
      onDone();
    }
    onDone();
  }

  async function handleGridXChange(e) {
    const newX = e.target.value;
    await db.table("maps").update(selectedMap.id, { gridX: newX });
    setGridX(newX);
    setMaps((prevMaps) => {
      const newMaps = [...prevMaps];
      const i = newMaps.findIndex((map) => map.id === selectedMap.id);
      if (i > -1) {
        newMaps[i].gridX = newX;
      }
      return newMaps;
    });
  }

  async function handleGridYChange(e) {
    const newY = e.target.value;
    await db.table("maps").update(selectedMap.id, { gridY: newY });
    setGridY(newY);
    setMaps((prevMaps) => {
      const newMaps = [...prevMaps];
      const i = newMaps.findIndex((map) => map.id === selectedMap.id);
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
            selectedMap={selectedMap && selectedMap.id}
            onMapSelect={handleMapSelect}
            onMapReset={handleMapReset}
            onSubmit={handleSubmit}
          />
          <Flex>
            <Box mb={2} mr={1} sx={{ flexGrow: 1 }}>
              <Label htmlFor="gridX">Columns</Label>
              <Input
                type="number"
                name="gridX"
                value={gridX}
                onChange={handleGridXChange}
                disabled={selectedMap === null || selectedMap.default}
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
                disabled={selectedMap === null || selectedMap.default}
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
