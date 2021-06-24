import React, { useState } from "react";
import { IconButton } from "theme-ui";

import SelectMapModal from "../../modals/SelectMapModal";
import SelectMapIcon from "../../icons/SelectMapIcon";

import { useMapData } from "../../contexts/MapDataContext";
import { useUserId } from "../../contexts/UserIdContext";

function SelectMapButton({
  onMapChange,
  onMapReset,
  currentMap,
  currentMapState,
  disabled,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { updateMapState } = useMapData();
  const userId = useUserId();
  function openModal() {
    if (currentMapState && currentMap && currentMap.owner === userId) {
      updateMapState(currentMapState.mapId, currentMapState);
    }
    setIsModalOpen(true);
  }

  function handleDone() {
    setIsModalOpen(false);
  }

  return (
    <>
      <IconButton
        aria-label="Select Map"
        title="Select Map"
        onClick={openModal}
        disabled={disabled}
      >
        <SelectMapIcon />
      </IconButton>
      <SelectMapModal
        isOpen={isModalOpen}
        onDone={handleDone}
        onMapChange={onMapChange}
        onMapReset={onMapReset}
        currentMap={currentMap}
      />
    </>
  );
}

export default SelectMapButton;
