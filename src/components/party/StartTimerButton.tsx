import React, { useState } from "react";
import { IconButton } from "theme-ui";

import StartTimerModal from "../../modals/StartTimerModal";
import StartTimerIcon from "../../icons/StartTimerIcon";

function StartTimerButton({ onTimerStart, onTimerStop, timer }: { onTimerStart: any, onTimerStop: any, timer: any }) {
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  function openModal() {
    setIsTimerModalOpen(true);
  }
  function closeModal() {
    setIsTimerModalOpen(false);
  }

  return (
    <>
      <IconButton
        m={1}
        aria-label="Start Timer"
        title="Start Timer"
        onClick={openModal}
      >
        <StartTimerIcon />
      </IconButton>
      <StartTimerModal
        isOpen={isTimerModalOpen}
        onRequestClose={closeModal}
        onTimerStart={onTimerStart}
        onTimerStop={onTimerStop}
        timer={timer}
      />
    </>
  );
}

export default StartTimerButton;
