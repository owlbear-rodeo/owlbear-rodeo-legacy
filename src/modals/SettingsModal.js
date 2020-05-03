import React, { useState, useContext } from "react";
import { Box, Label, Flex, Button, useColorMode, Checkbox } from "theme-ui";

import Modal from "../components/Modal";

import AuthContext from "../contexts/AuthContext";
import DatabaseContext from "../contexts/DatabaseContext";

function SettingsModal({ isOpen, onRequestClose }) {
  const { database } = useContext(DatabaseContext);
  const { userId } = useContext(AuthContext);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  async function handleEraseAllData() {
    await database.delete();
    window.location.reload();
  }

  async function handleClearCache() {
    await database.table("maps").where("owner").notEqual(userId).delete();
    // TODO: With custom tokens look up all tokens that aren't being used in a state
    window.location.reload();
  }

  const [colorMode, setColorMode] = useColorMode();

  return (
    <>
      <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
        <Flex sx={{ flexDirection: "column" }}>
          <Label py={2}>Settings</Label>
          <Label py={2}>
            Light theme
            <Checkbox
              checked={colorMode === "light"}
              onChange={(e) =>
                setColorMode(e.target.checked ? "light" : "default")
              }
              pl={1}
            />
          </Label>
          <Flex py={2}>
            <Button sx={{ flexGrow: 1 }} onClick={handleClearCache}>
              Clear cache
            </Button>
          </Flex>
          <Flex py={2}>
            <Button
              sx={{ flexGrow: 1 }}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Erase all content and reset
            </Button>
          </Flex>
        </Flex>
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        <Box>
          <Label py={2}>Are you sure?</Label>
          <Flex py={2}>
            <Button
              sx={{ flexGrow: 1 }}
              m={1}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button m={1} sx={{ flexGrow: 1 }} onClick={handleEraseAllData}>
              Erase
            </Button>
          </Flex>
        </Box>
      </Modal>
    </>
  );
}

export default SettingsModal;
