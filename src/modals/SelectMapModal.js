import React, { useRef, useState } from "react";
import { Button, Flex, Label, Box } from "theme-ui";
import { useToasts } from "react-toast-notifications";

import EditMapModal from "./EditMapModal";
import ConfirmModal from "./ConfirmModal";

import Modal from "../components/Modal";
import ImageDrop from "../components/ImageDrop";
import LoadingOverlay from "../components/LoadingOverlay";

import MapTiles from "../components/map/MapTiles";

import TilesOverlay from "../components/tile/TilesOverlay";
import TilesContainer from "../components/tile/TilesContainer";

import { groupsFromIds, itemsFromGroups, findGroup } from "../helpers/select";
import { createMapFromFile } from "../helpers/map";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

import { useMapData } from "../contexts/MapDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useKeyboard } from "../contexts/KeyboardContext";
import { useAssets } from "../contexts/AssetsContext";
import { GroupProvider } from "../contexts/GroupContext";

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
  const { addAssets } = useAssets();

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

  /**
   * Modal Controls
   */

  async function handleClose() {
    onDone();
  }

  async function handleMapSelect(mapId) {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const map = await getMap(mapId);
    const mapState = await getMapState(mapId);
    onMapChange(map, mapState);
    setIsLoading(false);
    onDone();
  }

  function handleSelectClick() {
    if (isLoading) {
      return;
    }
    if (selectedGroupIds.length === 1) {
      const group = findGroup(mapGroups, selectedGroupIds[0]);
      if (group && group.type === "item") {
        handleMapSelect(group.id);
      }
    } else {
      onMapChange(null, null);
      onDone();
    }
  }

  /**
   * Shortcuts
   */
  function handleKeyDown(event) {
    if (!isOpen) {
      return;
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

  useKeyboard(handleKeyDown);

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
          <Box sx={{ position: "relative" }} bg="muted">
            <GroupProvider
              groups={mapGroups}
              onGroupsChange={updateMapGroups}
              onGroupsSelect={setSelectedGroupIds}
              disabled={!isOpen}
            >
              <TilesContainer>
                <MapTiles
                  maps={maps}
                  onMapEdit={() => setIsEditModalOpen(true)}
                  onMapSelect={handleMapSelect}
                />
              </TilesContainer>
              <TilesOverlay>
                <MapTiles
                  maps={maps}
                  onMapEdit={() => setIsEditModalOpen(true)}
                  onMapSelect={handleMapSelect}
                  subgroup
                />
              </TilesOverlay>
            </GroupProvider>
          </Box>
          <Button
            variant="primary"
            disabled={isLoading || selectedGroupIds.length > 1}
            onClick={handleSelectClick}
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
