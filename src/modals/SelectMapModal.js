import React, { useRef, useState, useContext } from "react";
import { Button, Flex, Label } from "theme-ui";
import shortid from "shortid";

import Modal from "../components/Modal";
import MapTiles from "../components/map/MapTiles";
import MapSettings from "../components/map/MapSettings";
import ImageDrop from "../components/ImageDrop";

import blobToBuffer from "../helpers/blobToBuffer";

import MapDataContext from "../contexts/MapDataContext";
import AuthContext from "../contexts/AuthContext";

import { isEmpty } from "../helpers/shared";

const defaultMapSize = 22;
const defaultMapProps = {
  // Grid type
  // TODO: add support for hex horizontal and hex vertical
  gridType: "grid",
  showGrid: false,
};

function SelectMapModal({
  isOpen,
  onDone,
  onMapChange,
  onMapStateChange,
  // The map currently being view in the map screen
  currentMap,
}) {
  const { userId } = useContext(AuthContext);
  const {
    ownedMaps,
    mapStates,
    addMap,
    removeMap,
    resetMap,
    updateMap,
    updateMapState,
  } = useContext(MapDataContext);

  const [imageLoading, setImageLoading] = useState(false);

  // The map selected in the modal
  const [selectedMapId, setSelectedMapId] = useState(null);

  const selectedMap = ownedMaps.find((map) => map.id === selectedMapId);
  const selectedMapState = mapStates.find(
    (state) => state.mapId === selectedMapId
  );

  const fileInputRef = useRef();

  async function handleImagesUpload(files) {
    for (let file of files) {
      await handleImageUpload(file);
    }
    // Set file input to null to allow adding the same image 2 times in a row
    fileInputRef.current.value = null;
  }

  async function handleImageUpload(file) {
    if (!file) {
      return Promise.reject();
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

    const buffer = await blobToBuffer(file);
    // Copy file to avoid permissions issues
    const blob = new Blob([buffer]);
    // Create and load the image temporarily to get its dimensions
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
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
        resolve();
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleMapAdd(map) {
    await addMap(map);
    setSelectedMapId(map.id);
  }

  async function handleMapRemove(id) {
    await removeMap(id);
    setSelectedMapId(null);
    // Removed the map from the map screen if needed
    if (currentMap && currentMap.id === selectedMapId) {
      onMapChange(null, null);
    }
  }

  async function handleMapSelect(map) {
    await applyMapChanges();
    setSelectedMapId(map.id);
  }

  async function handleMapReset(id) {
    const newState = await resetMap(id);
    // Reset the state of the current map if needed
    if (currentMap && currentMap.id === selectedMapId) {
      onMapStateChange(newState);
    }
  }

  async function handleDone() {
    if (selectedMapId) {
      await applyMapChanges();
      onMapChange(selectedMapWithChanges, selectedMapStateWithChanges);
    }
    onDone();
  }

  /**
   * Map settings
   */
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  // Local cache of map setting changes
  // Applied when done is clicked or map selection is changed
  const [mapSettingChanges, setMapSettingChanges] = useState({});
  const [mapStateSettingChanges, setMapStateSettingChanges] = useState({});

  async function handleMapSettingsChange(key, value) {
    setMapSettingChanges((prevChanges) => ({ ...prevChanges, [key]: value }));
  }

  async function handleMapStateSettingsChange(key, value) {
    setMapStateSettingChanges((prevChanges) => ({
      ...prevChanges,
      [key]: value,
    }));
  }

  async function applyMapChanges() {
    if (
      selectedMapId &&
      (!isEmpty(mapSettingChanges) || !isEmpty(mapStateSettingChanges))
    ) {
      await updateMap(selectedMapId, mapSettingChanges);
      await updateMapState(selectedMapId, mapStateSettingChanges);

      setMapSettingChanges({});
      setMapStateSettingChanges({});
    }
  }

  const selectedMapWithChanges = { ...selectedMap, ...mapSettingChanges };
  const selectedMapStateWithChanges = {
    ...selectedMapState,
    ...mapStateSettingChanges,
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleDone}>
      <ImageDrop onDrop={handleImagesUpload} dropText="Drop map to upload">
        <input
          onChange={(event) => handleImagesUpload(event.target.files)}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          multiple
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
            maps={ownedMaps}
            onMapAdd={openImageDialog}
            onMapRemove={handleMapRemove}
            selectedMap={selectedMapWithChanges}
            selectedMapState={selectedMapStateWithChanges}
            onMapSelect={handleMapSelect}
            onMapReset={handleMapReset}
            onDone={handleDone}
          />
          <MapSettings
            map={selectedMapWithChanges}
            mapState={selectedMapStateWithChanges}
            onSettingsChange={handleMapSettingsChange}
            onStateSettingsChange={handleMapStateSettingsChange}
            showMore={showMoreSettings}
            onShowMoreChange={setShowMoreSettings}
          />
          <Button
            variant="primary"
            disabled={imageLoading}
            onClick={handleDone}
          >
            Done
          </Button>
        </Flex>
      </ImageDrop>
    </Modal>
  );
}

export default SelectMapModal;
