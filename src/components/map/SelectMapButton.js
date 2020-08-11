import React, { useState, useContext } from "react";
import { IconButton } from "theme-ui";

import SelectMapModal from "../../modals/SelectMapModal";
import SelectMapIcon from "../../icons/SelectMapIcon";

import MapDataContext from "../../contexts/MapDataContext";
import AuthContext from "../../contexts/AuthContext";

function SelectMapButton({
  onMapChange,
  onMapStateChange,
  currentMap,
  currentMapState,
  disabled,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { updateMapState } = useContext(MapDataContext);
  const { userId } = useContext(AuthContext);
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
        onMapStateChange={onMapStateChange}
        currentMap={currentMap}
      />
    </>
  );
}

export default SelectMapButton;
