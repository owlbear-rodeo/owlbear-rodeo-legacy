import React, { useState } from "react";
import { IconButton } from "theme-ui";

import SelectMapModal from "../../modals/SelectMapModal";
import SelectMapIcon from "../../icons/SelectMapIcon";

function SelectMapButton({ onMapChange }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  function openModal() {
    setIsAddModalOpen(true);
  }
  function closeModal() {
    setIsAddModalOpen(false);
  }

  function handleDone(map, mapState) {
    if (map) {
      onMapChange(map, mapState);
    }
    closeModal();
  }

  return (
    <>
      <IconButton
        aria-label="Select Map"
        title="Select Map"
        onClick={openModal}
      >
        <SelectMapIcon />
      </IconButton>
      <SelectMapModal
        isOpen={isAddModalOpen}
        onRequestClose={closeModal}
        onDone={handleDone}
      />
    </>
  );
}

export default SelectMapButton;
