import React, { useRef, useState, useContext } from "react";
import { Button, Flex, Label } from "theme-ui";
import shortid from "shortid";
import Case from "case";

import EditMapModal from "./EditMapModal";
import EditGroupModal from "./EditGroupModal";

import Modal from "../components/Modal";
import MapTiles from "../components/map/MapTiles";
import ImageDrop from "../components/ImageDrop";
import LoadingOverlay from "../components/LoadingOverlay";

import blobToBuffer from "../helpers/blobToBuffer";
import useKeyboard from "../helpers/useKeyboard";
import { resizeImage } from "../helpers/image";
import { useSearch, useGroup, handleItemSelect } from "../helpers/select";
import { getMapDefaultInset, gridSizeHeuristic } from "../helpers/map";

import MapDataContext from "../contexts/MapDataContext";
import AuthContext from "../contexts/AuthContext";

const defaultMapProps = {
  // Grid type
  showGrid: false,
  snapToGrid: true,
  quality: "original",
  group: "",
};

const mapResolutions = [
  { size: 512, quality: 0.5, id: "low" },
  { size: 1024, quality: 0.6, id: "medium" },
  { size: 2048, quality: 0.7, id: "high" },
  { size: 4096, quality: 0.8, id: "ultra" },
];

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
    removeMaps,
    resetMap,
    updateMap,
    updateMaps,
  } = useContext(MapDataContext);

  /**
   * Search
   */
  const [search, setSearch] = useState("");
  const [filteredMaps, filteredMapScores] = useSearch(ownedMaps, search);

  function handleSearchChange(event) {
    setSearch(event.target.value);
  }

  /**
   * Group
   */
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  async function handleMapsGroup(group) {
    setIsGroupModalOpen(false);
    updateMaps(selectedMapIds, { group });
  }

  const [mapsByGroup, mapGroups] = useGroup(
    ownedMaps,
    filteredMaps,
    !!search,
    filteredMapScores
  );

  /**
   * Image Upload
   */

  const fileInputRef = useRef();
  const [imageLoading, setImageLoading] = useState(false);

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
    let image = new Image();
    setImageLoading(true);

    const buffer = await blobToBuffer(file);
    // Copy file to avoid permissions issues
    const blob = new Blob([buffer]);
    // Create and load the image temporarily to get its dimensions
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      image.onload = async function () {
        // Find name and grid size
        let gridSize;
        let name = "Unknown Map";
        if (file.name) {
          if (file.name.matchAll) {
            // Match against a regex to find the grid size in the file name
            // e.g. Cave 22x23 will return [["22x22", "22", "x", "23"]]
            const gridMatches = [...file.name.matchAll(/(\d+) ?(x|X) ?(\d+)/g)];
            if (gridMatches.length > 0) {
              const lastMatch = gridMatches[gridMatches.length - 1];
              const matchX = parseInt(lastMatch[1]);
              const matchY = parseInt(lastMatch[3]);
              if (!isNaN(matchX) && !isNaN(matchY)) {
                gridSize = { x: matchX, y: matchY };
              }
            }
          }

          if (!gridSize) {
            gridSize = gridSizeHeuristic(image.width, image.height);
          }

          // Remove file extension
          name = file.name.replace(/\.[^/.]+$/, "");
          // Removed grid size expression
          name = name.replace(/(\[ ?|\( ?)?\d+ ?(x|X) ?\d+( ?\]| ?\))?/, "");
          // Clean string
          name = name.replace(/ +/g, " ");
          name = name.trim();
          // Capitalize and remove underscores
          name = Case.capital(name);
        }

        // Create resolutions
        const resolutions = {};
        for (let resolution of mapResolutions) {
          if (Math.max(image.width, image.height) > resolution.size) {
            const resized = await resizeImage(
              image,
              resolution.size,
              file.type,
              resolution.quality
            );
            const resizedBuffer = await blobToBuffer(resized.blob);
            resolutions[resolution.id] = {
              file: resizedBuffer,
              width: resized.width,
              height: resized.height,
              type: "file",
              id: resolution.id,
            };
          }
        }

        handleMapAdd({
          // Save as a buffer to send with msgpack
          file: buffer,
          resolutions,
          name,
          type: "file",
          grid: {
            size: gridSize,
            inset: getMapDefaultInset(
              image.width,
              image.height,
              gridSize.x,
              gridSize.y
            ),
            type: "square",
          },
          width: image.width,
          height: image.height,
          id: shortid.generate(),
          created: Date.now(),
          lastModified: Date.now(),
          lastUsed: Date.now(),
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

  /**
   * Map Controls
   */
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // The map selected in the modal
  const [selectedMapIds, setSelectedMapIds] = useState([]);

  const selectedMaps = ownedMaps.filter((map) =>
    selectedMapIds.includes(map.id)
  );
  const selectedMapStates = mapStates.filter((state) =>
    selectedMapIds.includes(state.mapId)
  );

  async function handleMapAdd(map) {
    await addMap(map);
    setSelectedMapIds([map.id]);
  }

  async function handleMapsRemove() {
    await removeMaps(selectedMapIds);
    setSelectedMapIds([]);
    // Removed the map from the map screen if needed
    if (currentMap && selectedMapIds.includes(currentMap.id)) {
      onMapChange(null, null);
    }
  }

  async function handleMapsReset() {
    for (let id of selectedMapIds) {
      const newState = await resetMap(id);
      // Reset the state of the current map if needed
      if (currentMap && currentMap.id === id) {
        onMapStateChange(newState);
      }
    }
  }

  // Either single, multiple or range
  const [selectMode, setSelectMode] = useState("single");

  function handleMapSelect(map) {
    handleItemSelect(
      map,
      selectMode,
      selectedMapIds,
      setSelectedMapIds,
      mapsByGroup,
      mapGroups
    );
  }

  /**
   * Modal Controls
   */

  async function handleClose() {
    onDone();
  }

  async function handleDone() {
    if (imageLoading) {
      return;
    }
    if (selectedMapIds.length === 1) {
      // Update last used for cache invalidation
      const lastUsed = Date.now();
      await updateMap(selectedMapIds[0], { lastUsed });
      onMapChange({ ...selectedMaps[0], lastUsed }, selectedMapStates[0]);
    } else {
      onMapChange(null, null);
    }
    onDone();
  }

  /**
   * Shortcuts
   */
  function handleKeyDown({ key }) {
    if (!isOpen) {
      return;
    }
    if (key === "Shift") {
      setSelectMode("range");
    }
    if (key === "Control" || key === "Meta") {
      setSelectMode("multiple");
    }
  }

  function handleKeyUp({ key }) {
    if (!isOpen) {
      return;
    }
    if (key === "Shift" && selectMode === "range") {
      setSelectMode("single");
    }
    if ((key === "Control" || key === "Meta") && selectMode === "multiple") {
      setSelectMode("single");
    }
  }

  useKeyboard(handleKeyDown, handleKeyUp);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{ maxWidth: "542px", width: "calc(100% - 16px)" }}
    >
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
            maps={mapsByGroup}
            groups={mapGroups}
            onMapAdd={openImageDialog}
            onMapEdit={() => setIsEditModalOpen(true)}
            onMapsReset={handleMapsReset}
            onMapsRemove={handleMapsRemove}
            selectedMaps={selectedMaps}
            selectedMapStates={selectedMapStates}
            onMapSelect={handleMapSelect}
            onDone={handleDone}
            selectMode={selectMode}
            onSelectModeChange={setSelectMode}
            search={search}
            onSearchChange={handleSearchChange}
            onMapsGroup={() => setIsGroupModalOpen(true)}
          />
          <Button
            variant="primary"
            disabled={imageLoading || selectedMapIds.length !== 1}
            onClick={handleDone}
            mt={2}
          >
            Select
          </Button>
        </Flex>
      </ImageDrop>
      {imageLoading && <LoadingOverlay bg="overlay" />}
      <EditMapModal
        isOpen={isEditModalOpen}
        onDone={() => setIsEditModalOpen(false)}
        map={selectedMaps.length === 1 && selectedMaps[0]}
        mapState={selectedMapStates.length === 1 && selectedMapStates[0]}
      />
      <EditGroupModal
        isOpen={isGroupModalOpen}
        onChange={handleMapsGroup}
        groups={mapGroups.filter(
          (group) => group !== "" && group !== "default"
        )}
        onRequestClose={() => setIsGroupModalOpen(false)}
        // Select the default group by testing whether all selected maps are the same
        defaultGroup={
          selectedMaps.length > 0 &&
          selectedMaps
            .map((map) => map.group)
            .reduce((prev, curr) => (prev === curr ? curr : undefined))
        }
      />
    </Modal>
  );
}

export default SelectMapModal;
