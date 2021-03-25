import React, { useRef, useState } from "react";
import { Button, Flex, Label } from "theme-ui";
import shortid from "shortid";
import Case from "case";

import EditMapModal from "./EditMapModal";
import EditGroupModal from "./EditGroupModal";
import ConfirmModal from "./ConfirmModal";

import Modal from "../components/Modal";
import MapTiles from "../components/map/MapTiles";
import ImageDrop from "../components/ImageDrop";
import LoadingOverlay from "../components/LoadingOverlay";

import blobToBuffer from "../helpers/blobToBuffer";
import { resizeImage, createThumbnail } from "../helpers/image";
import { useSearch, useGroup, handleItemSelect } from "../helpers/select";
import {
  getGridDefaultInset,
  getGridSizeFromImage,
  gridSizeVaild,
} from "../helpers/grid";
import Vector2 from "../helpers/Vector2";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

import { useMapData } from "../contexts/MapDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useKeyboard, useBlur } from "../contexts/KeyboardContext";

import shortcuts from "../shortcuts";

const defaultMapProps = {
  showGrid: false,
  snapToGrid: true,
  quality: "original",
  group: "",
};

const mapResolutions = [
  {
    size: 30, // Pixels per grid
    quality: 0.5, // JPEG compression quality
    id: "low",
  },
  { size: 70, quality: 0.6, id: "medium" },
  { size: 140, quality: 0.7, id: "high" },
  { size: 300, quality: 0.8, id: "ultra" },
];

function SelectMapModal({
  isOpen,
  onDone,
  onMapChange,
  onMapReset,
  // The map currently being view in the map screen
  currentMap,
}) {
  const { userId } = useAuth();
  const {
    ownedMaps,
    mapStates,
    addMap,
    removeMaps,
    resetMap,
    updateMap,
    updateMaps,
    mapsLoading,
    getMapFromDB,
    getMapStateFromDB,
  } = useMapData();

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
    setIsLoading(true);
    setIsGroupModalOpen(false);
    await updateMaps(selectedMapIds, { group });
    setIsLoading(false);
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
  const [isLoading, setIsLoading] = useState(false);

  async function handleImagesUpload(files) {
    if (navigator.storage) {
      // Attempt to enable persistant storage
      await navigator.storage.persist();
    }

    for (let file of files) {
      await handleImageUpload(file);
    }
    // Set file input to null to allow adding the same image 2 times in a row
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  }

  async function handleImageUpload(file) {
    if (!file) {
      return Promise.reject();
    }
    let image = new Image();
    setIsLoading(true);

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
            for (let match of gridMatches) {
              const matchX = parseInt(match[1]);
              const matchY = parseInt(match[3]);
              if (
                !isNaN(matchX) &&
                !isNaN(matchY) &&
                gridSizeVaild(matchX, matchY)
              ) {
                gridSize = { x: matchX, y: matchY };
              }
            }
          }

          if (!gridSize) {
            gridSize = await getGridSizeFromImage(image);
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

        if (!gridSize) {
          gridSize = { x: 22, y: 22 };
        }

        // Create resolutions
        const resolutions = {};
        for (let resolution of mapResolutions) {
          const resolutionPixelSize = Vector2.multiply(
            gridSize,
            resolution.size
          );
          if (
            image.width >= resolutionPixelSize.x &&
            image.height >= resolutionPixelSize.y
          ) {
            const resized = await resizeImage(
              image,
              Vector2.max(resolutionPixelSize),
              file.type,
              resolution.quality
            );
            if (resized.blob) {
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
        }
        // Create thumbnail
        const thumbnail = await createThumbnail(image, file.type);

        handleMapAdd({
          // Save as a buffer to send with msgpack
          file: buffer,
          resolutions,
          thumbnail,
          name,
          type: "file",
          grid: {
            size: gridSize,
            inset: getGridDefaultInset(
              { size: gridSize, type: "square" },
              image.width,
              image.height
            ),
            type: "square",
            measurement: {
              type: "chebyshev",
              scale: "5ft",
            },
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
        setIsLoading(false);
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

  const [isMapsRemoveModalOpen, setIsMapsRemoveModalOpen] = useState(false);
  async function handleMapsRemove() {
    setIsLoading(true);
    setIsMapsRemoveModalOpen(false);
    await removeMaps(selectedMapIds);
    setSelectedMapIds([]);
    // Removed the map from the map screen if needed
    if (currentMap && selectedMapIds.includes(currentMap.id)) {
      onMapChange(null, null);
    }
    setIsLoading(false);
  }

  const [isMapsResetModalOpen, setIsMapsResetModalOpen] = useState(false);
  async function handleMapsReset() {
    setIsLoading(true);
    setIsMapsResetModalOpen(false);
    for (let id of selectedMapIds) {
      const newState = await resetMap(id);
      // Reset the state of the current map if needed
      if (currentMap && currentMap.id === id) {
        onMapReset(newState);
      }
    }
    setIsLoading(false);
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
    if (isLoading) {
      return;
    }
    if (selectedMapIds.length === 1) {
      // Update last used for cache invalidation
      const lastUsed = Date.now();
      const map = selectedMaps[0];
      const mapState = await getMapStateFromDB(map.id);
      if (map.type === "file") {
        setIsLoading(true);
        await updateMap(map.id, { lastUsed });
        const updatedMap = await getMapFromDB(map.id);
        onMapChange(updatedMap, mapState);
        setIsLoading(false);
      } else {
        onMapChange(map, mapState);
      }
    } else {
      onMapChange(null, null);
    }
    onDone();
  }

  /**
   * Shortcuts
   */
  function handleKeyDown(event) {
    if (!isOpen) {
      return;
    }
    if (shortcuts.selectRange(event)) {
      setSelectMode("range");
    }
    if (shortcuts.selectMultiple(event)) {
      setSelectMode("multiple");
    }
    if (shortcuts.delete(event)) {
      // Selected maps and none are default
      if (
        selectedMapIds.length > 0 &&
        !selectedMaps.some((map) => map.type === "default")
      ) {
        // Ensure all other modals are closed
        setIsGroupModalOpen(false);
        setIsEditModalOpen(false);
        setIsMapsResetModalOpen(false);
        setIsMapsRemoveModalOpen(true);
      }
    }
  }

  function handleKeyUp(event) {
    if (!isOpen) {
      return;
    }
    if (shortcuts.selectRange(event) && selectMode === "range") {
      setSelectMode("single");
    }
    if (shortcuts.selectMultiple(event) && selectMode === "multiple") {
      setSelectMode("single");
    }
  }

  useKeyboard(handleKeyDown, handleKeyUp);

  // Set select mode to single when cmd+tabing
  function handleBlur() {
    setSelectMode("single");
  }

  useBlur(handleBlur);

  const layout = useResponsiveLayout();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{ maxWidth: layout.modalSize, width: "calc(100% - 16px)" }}
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
            onMapsReset={() => setIsMapsResetModalOpen(true)}
            onMapsRemove={() => setIsMapsRemoveModalOpen(true)}
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
            disabled={isLoading || selectedMapIds.length > 1}
            onClick={handleDone}
            mt={2}
          >
            Select
          </Button>
        </Flex>
      </ImageDrop>
      {(isLoading || mapsLoading) && <LoadingOverlay bg="overlay" />}
      <EditMapModal
        isOpen={isEditModalOpen}
        onDone={() => setIsEditModalOpen(false)}
        mapId={selectedMaps.length === 1 && selectedMaps[0].id}
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
      <ConfirmModal
        isOpen={isMapsResetModalOpen}
        onRequestClose={() => setIsMapsResetModalOpen(false)}
        onConfirm={handleMapsReset}
        confirmText="Reset"
        label={`Reset ${selectedMapIds.length} Map${
          selectedMapIds.length > 1 ? "s" : ""
        }`}
        description="This will remove all fog, drawings and tokens from the selected maps."
      />
      <ConfirmModal
        isOpen={isMapsRemoveModalOpen}
        onRequestClose={() => setIsMapsRemoveModalOpen(false)}
        onConfirm={handleMapsRemove}
        confirmText="Remove"
        label={`Remove ${selectedMapIds.length} Map${
          selectedMapIds.length > 1 ? "s" : ""
        }`}
        description="This operation cannot be undone."
      />
    </Modal>
  );
}

export default SelectMapModal;
