import React, { useState } from "react";
import { IconButton } from "theme-ui";

import SelectTokensIcon from "../../icons/SelectTokensIcon";

import SelectTokensModal from "../../modals/SelectTokensModal";

function SelectTokensButton({ onMapTokenStateCreate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  function openModal() {
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
  }

  function handleDone() {
    closeModal();
  }
  return (
    <>
      <IconButton
        aria-label="Edit Tokens"
        title="Edit Tokens"
        onClick={openModal}
      >
        <SelectTokensIcon />
      </IconButton>
      <SelectTokensModal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        onDone={handleDone}
        onMapTokenStateCreate={onMapTokenStateCreate}
      />
    </>
  );
}

export default SelectTokensButton;
