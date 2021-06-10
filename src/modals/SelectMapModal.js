import React, { useRef, useState, useEffect } from "react";
import { Flex, Label, Box } from "theme-ui";
import { useToasts } from "react-toast-notifications";
import ReactResizeDetector from "react-resize-detector";

import EditMapModal from "./EditMapModal";
import ConfirmModal from "./ConfirmModal";

import Modal from "../components/Modal";
import LoadingOverlay from "../components/LoadingOverlay";

import ImageDrop from "../components/image/ImageDrop";

import MapTiles from "../components/map/MapTiles";
import MapEditBar from "../components/map/MapEditBar";
import SelectMapSelectButton from "../components/map/SelectMapSelectButton";

import TilesOverlay from "../components/tile/TilesOverlay";
import TilesContainer from "../components/tile/TilesContainer";
import TileActionBar from "../components/tile/TileActionBar";

import { findGroup, getItemNames } from "../helpers/group";
import { createMapFromFile } from "../helpers/map";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

import { useMapData } from "../contexts/MapDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useAssets } from "../contexts/AssetsContext";
import { GroupProvider } from "../contexts/GroupContext";
import { TileDragProvider } from "../contexts/TileDragContext";

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
    mapsLoading,
    getMapState,
    getMap,
    updateMapGroups,
    updateMap,
    updateMapState,
    mapsById,
  } = useMapData();
  const { addAssets } = useAssets();

  // Get map names for group filtering
  const [mapNames, setMapNames] = useState(getItemNames(maps));
  useEffect(() => {
    setMapNames(getItemNames(maps));
  }, [maps]);

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

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
   * Modal Controls
   */

  async function handleClose() {
    onDone();
  }

  /**
   * Map Controls
   */
  async function handleMapSelect(mapId) {
    if (isLoading) {
      return;
    }
    if (mapId) {
      setIsLoading(true);
      const map = await getMap(mapId);
      const mapState = await getMapState(mapId);
      onMapChange(map, mapState);
      setIsLoading(false);
    } else {
      onMapChange(null, null);
    }
    onDone();
  }

  const [editingMapId, setEditingMapId] = useState();

  const [isDraggingMap, setIsDraggingMap] = useState(false);

  const [canAddDraggedMap, setCanAddDraggedMap] = useState(false);
  function handleGroupsSelect(groupIds) {
    if (groupIds.length === 1) {
      // Only allow adding a map from dragging if there is a single group item selected
      const group = findGroup(mapGroups, groupIds[0]);
      setCanAddDraggedMap(group && group.type === "item");
    } else {
      setCanAddDraggedMap(false);
    }
  }

  function handleDragAdd(groupIds) {
    if (groupIds.length === 1) {
      handleMapSelect(groupIds[0]);
    }
  }

  const layout = useResponsiveLayout();

  const [modalSize, setModalSize] = useState({ width: 0, height: 0 });
  function handleModalResize(width, height) {
    setModalSize({ width, height });
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{ maxWidth: layout.modalSize, width: "calc(100% - 16px)" }}
      shouldCloseOnEsc={!isDraggingMap}
    >
      <ImageDrop onDrop={handleImagesUpload} dropText="Drop map to import">
        <input
          onChange={(event) => handleImagesUpload(event.target.files)}
          type="file"
          accept="image/jpeg, image/gif, image/png, image/webp"
          style={{ display: "none" }}
          multiple
          ref={fileInputRef}
        />
        <ReactResizeDetector
          handleWidth
          handleHeight
          onResize={handleModalResize}
          refreshMode="debounce"
        >
          <GroupProvider
            groups={mapGroups}
            itemNames={mapNames}
            onGroupsChange={updateMapGroups}
            onGroupsSelect={handleGroupsSelect}
            disabled={!isOpen}
          >
            <Flex
              sx={{
                flexDirection: "column",
              }}
            >
              <Label pt={2} pb={1}>
                Select or import a map
              </Label>
              <TileActionBar onAdd={openImageDialog} addTitle="Import Map(s)" />
              <Box sx={{ position: "relative" }}>
                <TileDragProvider
                  onDragAdd={canAddDraggedMap && handleDragAdd}
                  onDragStart={() => setIsDraggingMap(true)}
                  onDragEnd={() => setIsDraggingMap(false)}
                  onDragCancel={() => setIsDraggingMap(false)}
                >
                  <TilesContainer>
                    <MapTiles
                      mapsById={mapsById}
                      onMapEdit={setEditingMapId}
                      onMapSelect={handleMapSelect}
                    />
                  </TilesContainer>
                </TileDragProvider>
                <TileDragProvider
                  onDragAdd={canAddDraggedMap && handleDragAdd}
                  onDragStart={() => setIsDraggingMap(true)}
                  onDragEnd={() => setIsDraggingMap(false)}
                  onDragCancel={() => setIsDraggingMap(false)}
                >
                  <TilesOverlay modalSize={modalSize}>
                    <MapTiles
                      mapsById={mapsById}
                      onMapEdit={setEditingMapId}
                      onMapSelect={handleMapSelect}
                      subgroup
                    />
                  </TilesOverlay>
                </TileDragProvider>
                <MapEditBar
                  currentMap={currentMap}
                  disabled={isLoading || editingMapId}
                  onMapChange={onMapChange}
                  onMapReset={onMapReset}
                  onLoad={setIsLoading}
                />
              </Box>
              <SelectMapSelectButton
                onMapSelect={handleMapSelect}
                disabled={isLoading}
              />
            </Flex>
          </GroupProvider>
        </ReactResizeDetector>
      </ImageDrop>
      {(isLoading || mapsLoading) && <LoadingOverlay bg="overlay" />}
      <EditMapModal
        isOpen={!!editingMapId}
        onDone={() => setEditingMapId()}
        map={editingMapId && maps.find((map) => map.id === editingMapId)}
        mapState={
          editingMapId &&
          mapStates.find((state) => state.mapId === editingMapId)
        }
        onUpdateMap={updateMap}
        onUpdateMapState={updateMapState}
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
