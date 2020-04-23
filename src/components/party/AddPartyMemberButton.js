import React, { useState } from "react";
import { IconButton } from "theme-ui";

import AddPartyMemberModal from "../../modals/AddPartyMemberModal";
import AddPartyMemberIcon from "../../icons/AddPartyMemberIcon";

function AddPartyMemberButton({ gameId }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  function openModal() {
    setIsAddModalOpen(true);
  }
  function closeModal() {
    setIsAddModalOpen(false);
  }

  return (
    <>
      <IconButton
        m={1}
        aria-label="Add Party Member"
        title="Add Party Member"
        onClick={openModal}
      >
        <AddPartyMemberIcon />
      </IconButton>
      <AddPartyMemberModal
        isOpen={isAddModalOpen}
        onRequestClose={closeModal}
        gameId={gameId}
      />
    </>
  );
}

export default AddPartyMemberButton;
