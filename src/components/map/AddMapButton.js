import React, { useState } from "react";
import { IconButton } from "theme-ui";

import AddMapModal from "../../modals/AddMapModal";
import AddMapIcon from "../../icons/AddMapIcon";

function AddMapButton({ onMapChange }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  function openModal() {
    setIsAddModalOpen(true);
  }
  function closeModal() {
    setIsAddModalOpen(false);
  }

  function handleDone(map) {
    onMapChange(map);
    closeModal();
  }

  return (
    <>
      <IconButton aria-label="Add Map" title="Add Map" onClick={openModal}>
        <AddMapIcon />
      </IconButton>
      <AddMapModal
        isOpen={isAddModalOpen}
        onRequestClose={closeModal}
        onDone={handleDone}
      />
    </>
  );
}

export default AddMapButton;
