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
    localStorage.clear();
    await database.delete();
    window.location.reload();
  }

  async function handleClearCache() {
    // Clear saved settings
    localStorage.clear();
    // Clear map cache
    await database.table("maps").where("owner").notEqual(userId).delete();
    // Find all other peoples tokens who aren't benig used in a map state and delete them
    const tokens = await database
      .table("tokens")
      .where("owner")
      .notEqual(userId)
      .toArray();
    const states = await database.table("states").toArray();
    for (let token of tokens) {
      let inUse = false;
      for (let state of states) {
        for (let tokenState of Object.values(state.tokens)) {
          if (token.id === tokenState.tokenId) {
            inUse = true;
          }
        }
      }
      if (!inUse) {
        database.table("tokens").delete(token.id);
      }
    }
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
