import React, { useState, useContext } from "react";
import { IconButton } from "theme-ui";

import SelectDiceIcon from "../../../icons/SelectDiceIcon";
import SelectDiceModal from "../../../modals/SelectDiceModal";

import MapInteractionContext from "../../../contexts/MapInteractionContext";

function SelectDiceButton({ onDiceChange, currentDice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setPreventMapInteraction } = useContext(MapInteractionContext);

  function openModal() {
    setIsModalOpen(true);
    setPreventMapInteraction(true);
  }
  function closeModal() {
    setIsModalOpen(false);
    setPreventMapInteraction(false);
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
