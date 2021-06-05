import React, { useState, useEffect } from "react";
import { Flex, Close, IconButton } from "theme-ui";

import { groupsFromIds, itemsFromGroups } from "../../helpers/group";

import ConfirmModal from "../../modals/ConfirmModal";

import ResetMapIcon from "../../icons/ResetMapIcon";
import RemoveMapIcon from "../../icons/RemoveMapIcon";

import { useGroup } from "../../contexts/GroupContext";
import { useMapData } from "../../contexts/MapDataContext";
import { useKeyboard } from "../../contexts/KeyboardContext";

import shortcuts from "../../shortcuts";

function MapEditBar({ currentMap, disabled, onMapChange, onMapReset, onLoad }) {
  const [hasMapState, setHasMapState] = useState(false);
  const [hasSelectedDefaultMap, setHasSelectedDefaultMap] = useState(false);

  const { maps, mapStates, removeMaps, resetMap } = useMapData();

  const { activeGroups, selectedGroupIds, onGroupSelect } = useGroup();

  useEffect(() => {
    const selectedGroups = groupsFromIds(selectedGroupIds, activeGroups);
    const selectedMaps = itemsFromGroups(selectedGroups, maps);
    const selectedMapStates = itemsFromGroups(
      selectedGroups,
      mapStates,
      "mapId"
    );

    setHasSelectedDefaultMap(
      selectedMaps.some((map) => map.type === "default")
    );

    let _hasMapState = false;
    for (let state of selectedMapStates) {
      if (
        Object.values(state.tokens).length > 0 ||
        Object.values(state.drawShapes).length > 0 ||
        Object.values(state.fogShapes).length > 0 ||
        Object.values(state.notes).length > 0
      ) {
        _hasMapState = true;
        break;
      }
    }

    setHasMapState(_hasMapState);
  }, [selectedGroupIds, maps, mapStates, activeGroups]);

  function getSelectedMaps() {
    const selectedGroups = groupsFromIds(selectedGroupIds, activeGroups);
    return itemsFromGroups(selectedGroups, maps);
  }

  const [isMapsRemoveModalOpen, setIsMapsRemoveModalOpen] = useState(false);
  async function handleMapsRemove() {
    onLoad(true);
    setIsMapsRemoveModalOpen(false);
    const selectedMaps = getSelectedMaps();
    const selectedMapIds = selectedMaps.map((map) => map.id);
    await removeMaps(selectedMapIds);
    onGroupSelect();
    // Removed the map from the map screen if needed
    if (currentMap && selectedMapIds.includes(currentMap.id)) {
      onMapChange(null, null);
    }
    onLoad(false);
  }

  const [isMapsResetModalOpen, setIsMapsResetModalOpen] = useState(false);
  async function handleMapsReset() {
    onLoad(true);
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
    onLoad(false);
  }

  /**
   * Shortcuts
   */
  function handleKeyDown(event) {
    if (disabled) {
      return;
    }
    if (shortcuts.delete(event)) {
      const selectedMaps = getSelectedMaps();
      // Selected maps and none are default
      if (
        selectedMaps.length > 0 &&
        !selectedMaps.some((map) => map.type === "default")
      ) {
        setIsMapsResetModalOpen(false);
        setIsMapsRemoveModalOpen(true);
      }
    }
  }

  useKeyboard(handleKeyDown);

  if (selectedGroupIds.length === 0) {
    return null;
  }

  return (
    <Flex
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "space-between",
      }}
      bg="overlay"
    >
      <Close
        title="Clear Selection"
        aria-label="Clear Selection"
        onClick={() => onGroupSelect()}
      />
      <Flex>
        <IconButton
          aria-label="Reset Selected Map(s)"
          title="Reset Selected Map(s)"
          onClick={() => setIsMapsResetModalOpen(true)}
          disabled={!hasMapState}
        >
          <ResetMapIcon />
        </IconButton>
        <IconButton
          aria-label="Remove Selected Map(s)"
          title="Remove Selected Map(s)"
          onClick={() => setIsMapsRemoveModalOpen(true)}
          disabled={hasSelectedDefaultMap}
        >
          <RemoveMapIcon />
        </IconButton>
      </Flex>
      <ConfirmModal
        isOpen={isMapsResetModalOpen}
        onRequestClose={() => setIsMapsResetModalOpen(false)}
        onConfirm={handleMapsReset}
        confirmText="Reset"
        label="Reset Selected Map(s)"
        description="This will remove all fog, drawings and tokens from the selected maps."
      />
      <ConfirmModal
        isOpen={isMapsRemoveModalOpen}
        onRequestClose={() => setIsMapsRemoveModalOpen(false)}
        onConfirm={handleMapsRemove}
        confirmText="Remove"
        label="Remove Selected Map(s)"
        description="This operation cannot be undone."
      />
    </Flex>
  );
}

export default MapEditBar;
