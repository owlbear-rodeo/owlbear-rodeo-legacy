import React, { useState, useContext } from "react";
import { Button, Flex, Label } from "theme-ui";

import Modal from "../components/Modal";
import TokenSettings from "../components/token/TokenSettings";

import TokenDataContext from "../contexts/TokenDataContext";

import { isEmpty } from "../helpers/shared";

function EditTokenModal({ isOpen, onDone, token }) {
  const { updateToken } = useContext(TokenDataContext);

  function handleClose() {
    setTokenSettingChanges({});
    onDone();
  }

  async function handleSave() {
    await applyTokenChanges();
    onDone();
  }

  const [tokenSettingChanges, setTokenSettingChanges] = useState({});

  function handleTokenSettingsChange(key, value) {
    setTokenSettingChanges((prevChanges) => ({ ...prevChanges, [key]: value }));
  }

  async function applyTokenChanges() {
    if (token && !isEmpty(tokenSettingChanges)) {
      // Ensure size value is positive
      let verifiedChanges = { ...tokenSettingChanges };
      if ("defaultSize" in verifiedChanges) {
        verifiedChanges.defaultSize = verifiedChanges.defaultSize || 1;
      }

      await updateToken(token.id, verifiedChanges);
      setTokenSettingChanges({});
    }
  }

  const selectedTokenWithChanges = {
    ...token,
    ...tokenSettingChanges,
  };

  const [showMoreSettings, setShowMoreSettings] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{ maxWidth: "542px", width: "calc(100% - 16px)" }}
    >
      <Flex
        sx={{
          flexDirection: "column",
        }}
      >
        <Label pt={2} pb={1}>
          Edit token
        </Label>
        <TokenSettings
          token={selectedTokenWithChanges}
          showMore={showMoreSettings}
          onSettingsChange={handleTokenSettingsChange}
          onShowMoreChange={setShowMoreSettings}
        />
        <Button onClick={handleSave}>Save</Button>
      </Flex>
    </Modal>
  );
}

export default EditTokenModal;
