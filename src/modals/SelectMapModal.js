import React, { useRef, useState, useEffect, useContext } from "react";
import { Box, Button, Flex, Label, Text } from "theme-ui";
import shortid from "shortid";

import Modal from "../components/Modal";
import MapTiles from "../components/map/MapTiles";
import MapSettings from "../components/map/MapSettings";

import AuthContext from "../contexts/AuthContext";
import DatabaseContext from "../contexts/DatabaseContext";

import usePrevious from "../helpers/usePrevious";
import blobToBuffer from "../helpers/blobToBuffer";

import { maps as defaultMaps } from "../maps";

const defaultMapSize = 22;
const defaultMapState = {
  tokens: {},
  // An index into the draw actions array to which only actions before the
  // index will be performed (used in undo and redo)
  mapDrawActionIndex: -1,
  mapDrawActions: [],
  fogDrawActionIndex: -1,
  fogDrawActions: [],
  // Flags to determine what other people can edit
  editFlags: ["drawing", "tokens"],
};

const defaultMapProps = {
  // Grid type
  // TODO: add support for hex horizontal and hex vertical
  gridType: "grid",
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
  const { database } = useContext(DatabaseContext);
  const { userId } = useContext(AuthContext);

  const wasOpen = usePrevious(isOpen);

  const [imageLoading, setImageLoading] = useState(false);

  // The map selected in the modal
  const [selectedMap, setSelectedMap] = useState(null);
  const [selectedMapState, setSelectedMapState] = useState(null);
  const [maps, setMaps] = useState([]);
  // Load maps from the database and ensure state is properly setup
  useEffect(() => {
    if (!userId || !database) {
      return;
    }
    async function getDefaultMaps() {
      const defaultMapsWithIds = [];
      for (let i = 0; i < defaultMaps.length; i++) {
        const defaultMap = defaultMaps[i];
        const id = `__default-${defaultMap.name}`;
        defaultMapsWithIds.push({
          ...defaultMap,
          id,
          owner: userId,
          // Emulate the time increasing to avoid sort errors
          created: Date.now() + i,
          lastModified: Date.now() + i,
          ...defaultMapProps,
        });
        // Add a state for the map if there isn't one already
        const state = await database.table("states").get(id);
        if (!state) {
          await database.table("states").add({ ...defaultMapState, mapId: id });
        }
      }
      return defaultMapsWithIds;
    }

    async function loadMaps() {
      let storedMaps = await database
        .table("maps")
        .where({ owner: userId })
        .toArray();
      const sortedMaps = storedMaps.sort((a, b) => b.created - a.created);
      const defaultMapsWithIds = await getDefaultMaps();
      const allMaps = [...sortedMaps, ...defaultMapsWithIds];
      setMaps(allMaps);

      // reload map state as is may have changed while the modal was closed
      if (selectedMap) {
        const state = await database.table("states").get(selectedMap.id);
        if (state) {
          setSelectedMapState(state);
        }
      }
    }

    if (!wasOpen && isOpen) {
      loadMaps();
    }
  }, [userId, database, isOpen, wasOpen, selectedMap]);

  const fileInputRef = useRef();

  function handleImageUpload(file) {
    if (!file) {
      return;
    }
    let fileGridX = defaultMapSize;
    let fileGridY = defaultMapSize;
    let name = "Unknown Map";
    if (file.name) {
      // TODO: match all not supported on safari, find alternative
      if (file.name.matchAll) {
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

      // Remove file extension
      name = file.name.replace(/\.[^/.]+$/, "");
      // Removed grid size expression
      name = name.replace(/(\[ ?|\( ?)?\d+ ?(x|X) ?\d+( ?\]| ?\))?/, "");
      // Clean string
      name = name.replace(/ +/g, " ");
      name = name.trim();
    }
    let image = new Image();
    setImageLoading(true);

    blobToBuffer(file).then((buffer) => {
      // Copy file to avoid permissions issues
      const blob = new Blob([buffer]);
      // Create and load the image temporarily to get its dimensions
      const url = URL.createObjectURL(blob);
      image.onload = function () {
        handleMapAdd({
          // Save as a buffer to send with msgpack
          file: buffer,
          name,
          type: "file",
          gridX: fileGridX,
          gridY: fileGridY,
          width: image.width,
          height: image.height,
          id: shortid.generate(),
          created: Date.now(),
          lastModified: Date.now(),
          owner: userId,
          ...defaultMapProps,
        });
        setImageLoading(false);
        URL.revokeObjectURL(url);
      };
      image.src = url;

      // Set file input to null to allow adding the same image 2 times in a row
      fileInputRef.current.value = null;
    });
  }

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleMapAdd(map) {
    await database.table("maps").add(map);
    const state = { ...defaultMapState, mapId: map.id };
    await database.table("states").add(state);
    setMaps((prevMaps) => [map, ...prevMaps]);
    setSelectedMap(map);
    setSelectedMapState(state);
  }

  async function handleMapRemove(id) {
    await database.table("maps").delete(id);
    await database.table("states").delete(id);
    setMaps((prevMaps) => {
      const filtered = prevMaps.filter((map) => map.id !== id);
      setSelectedMap(filtered[0]);
      database.table("states").get(filtered[0].id).then(setSelectedMapState);
      return filtered;
    });
    // Removed the map from the map screen if needed
    if (currentMap && currentMap.id === selectedMap.id) {
      onMapChange(null, null);
    }
  }

  async function handleMapSelect(map) {
    const state = await database.table("states").get(map.id);
    setSelectedMapState(state);
    setSelectedMap(map);
  }

  async function handleMapReset(id) {
    const state = { ...defaultMapState, mapId: id };
    await database.table("states").put(state);
    setSelectedMapState(state);
    // Reset the state of the current map if needed
    if (currentMap && currentMap.id === selectedMap.id) {
      onMapStateChange(state);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedMap) {
      onMapChange(selectedMap, selectedMapState);
      onDone();
    }
    onDone();
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

  /**
   * Map settings
   */
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  async function handleMapSettingsChange(key, value) {
    const change = { [key]: value, lastModified: Date.now() };
    database.table("maps").update(selectedMap.id, change);
    const newMap = { ...selectedMap, ...change };
    setMaps((prevMaps) => {
      const newMaps = [...prevMaps];
      const i = newMaps.findIndex((map) => map.id === selectedMap.id);
      if (i > -1) {
        newMaps[i] = newMap;
      }
      return newMaps;
    });
    setSelectedMap(newMap);
  }

  async function handleMapStateSettingsChange(key, value) {
    database.table("states").update(selectedMap.id, { [key]: value });
    setSelectedMapState((prevState) => ({ ...prevState, [key]: value }));
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
            selectedMap={selectedMap}
            selectedMapState={selectedMapState}
            onMapSelect={handleMapSelect}
            onMapReset={handleMapReset}
            onSubmit={handleSubmit}
          />
          <MapSettings
            map={selectedMap}
            mapState={selectedMapState}
            onSettingsChange={handleMapSettingsChange}
            onStateSettingsChange={handleMapStateSettingsChange}
            showMore={showMoreSettings}
            onShowMoreChange={setShowMoreSettings}
          />
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
