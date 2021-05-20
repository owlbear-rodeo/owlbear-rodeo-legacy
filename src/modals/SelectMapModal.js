import React, { useRef, useState } from "react";
import { Button, Flex, Label } from "theme-ui";
import { useToasts } from "react-toast-notifications";

import EditMapModal from "./EditMapModal";
import ConfirmModal from "./ConfirmModal";

import Modal from "../components/Modal";
import MapTiles from "../components/map/MapTiles";
import ImageDrop from "../components/ImageDrop";
import LoadingOverlay from "../components/LoadingOverlay";

import {
  groupsFromIds,
  handleItemSelect,
  itemsFromGroups,
} from "../helpers/select";
import { createMapFromFile } from "../helpers/map";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

import { useMapData } from "../contexts/MapDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useKeyboard, useBlur } from "../contexts/KeyboardContext";
import { useAssets } from "../contexts/AssetsContext";
import { useDatabase } from "../contexts/DatabaseContext";

import shortcuts from "../shortcuts";

function SelectMapModal({
  isOpen,
  onDone,
  onMapChange,
  onMapReset,
  // The map currently being view in the map screen
  currentMap,
}) {
  const { addToast } = useToasts();

  const { userId } = useAuth();
  const {
    maps,
    mapStates,
    mapGroups,
    addMap,
    removeMaps,
    resetMap,
    mapsLoading,
    getMapState,
    getMap,
    updateMapGroups,
    updateMap,
    updateMapState,
  } = useMapData();
  const { databaseStatus } = useDatabase();
  const { addAssets } = useAssets();

  /**
   * Search
   */
  const [search, setSearch] = useState("");
  // TODO: Add back with new group support
  // const [filteredMaps, filteredMapScores] = useSearch(ownedMaps, search);

  function handleSearchChange(event) {
    setSearch(event.target.value);
  }

  /**
   * Image Upload
   */

  const fileInputRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const [isLargeImageWarningModalOpen, setShowLargeImageWarning] = useState(
    false
  );
  const largeImageWarningFiles = useRef();

  async function handleImagesUpload(files) {
    if (navigator.storage) {
      // Attempt to enable persistant storage
      await navigator.storage.persist();
    }

    let mapFiles = [];
    for (let file of files) {
      if (file.size > 5e7) {
        addToast(`Unable to import map ${file.name} as it is over 50MB`);
      } else {
        mapFiles.push(file);
      }
    }

    // Any file greater than 20MB
    if (mapFiles.some((file) => file.size > 2e7)) {
      largeImageWarningFiles.current = mapFiles;
      setShowLargeImageWarning(true);
      return;
    }

    for (let file of mapFiles) {
      await handleImageUpload(file);
    }

    clearFileInput();
  }

  function clearFileInput() {
    // Set file input to null to allow adding the same image 2 times in a row
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  }

  function handleLargeImageWarningCancel() {
    largeImageWarningFiles.current = undefined;
    setShowLargeImageWarning(false);
    clearFileInput();
  }

  async function handleLargeImageWarningConfirm() {
    setShowLargeImageWarning(false);
    const files = largeImageWarningFiles.current;
    for (let file of files) {
      await handleImageUpload(file);
    }
    largeImageWarningFiles.current = undefined;
    clearFileInput();
  }

  async function handleImageUpload(file) {
    setIsLoading(true);
    const { map, assets } = await createMapFromFile(file, userId);
    await addMap(map);
    await addAssets(assets);
    setIsLoading(false);
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
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  function getSelectedMaps() {
    const groups = groupsFromIds(selectedGroupIds, mapGroups);
    return itemsFromGroups(groups, maps);
  }

  const [isMapsRemoveModalOpen, setIsMapsRemoveModalOpen] = useState(false);
  async function handleMapsRemove() {
    setIsLoading(true);
    setIsMapsRemoveModalOpen(false);
    const selectedMaps = getSelectedMaps();
    const selectedMapIds = selectedMaps.map((map) => map.id);
    await removeMaps(selectedMapIds);
    setSelectedGroupIds([]);
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
    const selectedMaps = getSelectedMaps();
    const selectedMapIds = selectedMaps.map((map) => map.id);
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

  function handleTileSelect(item) {
    handleItemSelect(
      item,
      selectMode,
      selectedGroupIds,
      setSelectedGroupIds
      // TODO: Add new group support
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
    const groups = groupsFromIds(selectedGroupIds, mapGroups);
    if (groups.length === 1 && groups[0].type === "item") {
      setIsLoading(true);
      const map = await getMap(groups[0].id);
      const mapState = await getMapState(groups[0].id);
      onMapChange(map, mapState);
      setIsLoading(false);
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
      const selectedMaps = getSelectedMaps();
      // Selected maps and none are default
      if (
        selectedMaps.length > 0 &&
        !selectedMaps.some((map) => map.type === "default")
      ) {
        // Ensure all other modals are closed
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
            maps={maps}
            mapStates={mapStates}
            groups={mapGroups}
            selectedGroupIds={selectedGroupIds}
            onMapAdd={openImageDialog}
            onMapEdit={() => setIsEditModalOpen(true)}
            onMapsReset={() => setIsMapsResetModalOpen(true)}
            onMapsRemove={() => setIsMapsRemoveModalOpen(true)}
            onTileSelect={handleTileSelect}
            onDone={handleDone}
            selectMode={selectMode}
            onSelectModeChange={setSelectMode}
            search={search}
            onSearchChange={handleSearchChange}
            onMapsGroup={updateMapGroups}
            databaseDisabled={databaseStatus === "disabled"}
          />
          <Button
            variant="primary"
            disabled={isLoading || selectedGroupIds.length > 1}
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
        map={
          selectedGroupIds.length === 1 &&
          maps.find((map) => map.id === selectedGroupIds[0])
        }
        mapState={
          selectedGroupIds.length === 1 &&
          mapStates.find((state) => state.mapId === selectedGroupIds[0])
        }
        onUpdateMap={updateMap}
        onUpdateMapState={updateMapState}
      />
      <ConfirmModal
        isOpen={isMapsResetModalOpen}
        onRequestClose={() => setIsMapsResetModalOpen(false)}
        onConfirm={handleMapsReset}
        confirmText="Reset"
        label={`Reset ${selectedGroupIds.length} Map${
          selectedGroupIds.length > 1 ? "s" : ""
        }`}
        description="This will remove all fog, drawings and tokens from the selected maps."
      />
      <ConfirmModal
        isOpen={isMapsRemoveModalOpen}
        onRequestClose={() => setIsMapsRemoveModalOpen(false)}
        onConfirm={handleMapsRemove}
        confirmText="Remove"
        label="Remove Map(s)"
        description="This operation cannot be undone."
      />
      <ConfirmModal
        isOpen={isLargeImageWarningModalOpen}
        onRequestClose={handleLargeImageWarningCancel}
        onConfirm={handleLargeImageWarningConfirm}
        confirmText="Continue"
        label="Warning"
        description="An imported image is larger than 20MB, this may cause slowness. Continue?"
      />
    </Modal>
  );
}

export default SelectMapModal;
