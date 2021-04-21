import React, { useState } from "react";
import { Flex, Label, Button } from "theme-ui";

import Modal from "../components/Modal";
import DiceTiles from "../components/dice/DiceTiles";

import { dice } from "../dice";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

function SelectDiceModal({ isOpen, onRequestClose, onDone, defaultDice }) {
  const [selectedDice, setSelectedDice] = useState(defaultDice);
  const layout = useResponsiveLayout();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ maxWidth: layout.modalSize, width: "calc(100% - 16px)" }}
    >
      <Flex
        sx={{
          flexDirection: "column",
        }}
      >
        <Label pt={2} pb={1}>
          Select a dice style
        </Label>
        <DiceTiles
          dice={dice}
          onDiceSelect={setSelectedDice}
          selectedDice={selectedDice}
          onDone={onDone}
        />
        <Button my={2} variant="primary" onClick={() => onDone(selectedDice)}>
          Select
        </Button>
      </Flex>
    </Modal>
  );
}

export default SelectDiceModal;
