import React, { useState } from "react";
import { IconButton } from "theme-ui";

import SettingsIcon from "../icons/SettingsIcon";
import SettingsModal from "../modals/SettingsModal";

function SettingsButton() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  function openModal() {
    setIsSettingsModalOpen(true);
  }
  function closeModal() {
    setIsSettingsModalOpen(false);
  }

  return (
    <>
      <IconButton
        m={1}
        aria-label="Settings"
        title="Settings"
        onClick={openModal}
      >
        <SettingsIcon />
      </IconButton>
      <SettingsModal isOpen={isSettingsModalOpen} onRequestClose={closeModal} />
    </>
  );
}

export default SettingsButton;
