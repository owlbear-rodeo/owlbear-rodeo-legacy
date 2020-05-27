import React, { useState } from "react";
import { IconButton } from "theme-ui";

import SelectDiceIcon from "../../../icons/SelectDiceIcon";
import SelectDiceModal from "../../../modals/SelectDiceModal";

function SelectDiceButton({ onDiceChange, currentDice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function openModal() {
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
  }

  function handleDone(dice) {
    onDiceChange(dice);
    closeModal();
  }

  return (
    <>
      <IconButton
        aria-label="Select Dice Style"
        title="Select Dice Style"
        color="hsl(210, 50%, 96%)"
        onClick={openModal}
      >
        <SelectDiceIcon />
      </IconButton>
      <SelectDiceModal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        defaultDice={currentDice}
        onDone={handleDone}
      />
    </>
  );
}

export default SelectDiceButton;
