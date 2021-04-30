import React, { useState, useEffect } from "react";
import { Button, Flex, Label } from "theme-ui";

import Modal from "../components/Modal";
import TokenSettings from "../components/token/TokenSettings";
import TokenPreview from "../components/token/TokenPreview";
import LoadingOverlay from "../components/LoadingOverlay";

import { useTokenData } from "../contexts/TokenDataContext";

import { isEmpty } from "../helpers/shared";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

function EditTokenModal({ isOpen, onDone, tokenId }) {
  const { updateToken, getToken } = useTokenData();

  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState();
  useEffect(() => {
    async function loadToken() {
      setIsLoading(true);
      setToken(await getToken(tokenId));
      setIsLoading(false);
    }

    if (isOpen && tokenId) {
      loadToken();
    } else {
      setToken();
    }
  }, [isOpen, tokenId, getToken]);

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

  const layout = useResponsiveLayout();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{
        maxWidth: layout.modalSize,
        width: "calc(100% - 16px)",
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
        }}
      >
        <Label pt={2} pb={1}>
          Edit token
        </Label>
        {isLoading || !token ? (
          <Flex
            sx={{
              width: "100%",
              height: layout.screenSize === "large" ? "500px" : "300px",
              position: "relative",
            }}
            bg="muted"
          >
            <LoadingOverlay />
          </Flex>
        ) : (
          <TokenPreview token={selectedTokenWithChanges} />
        )}
        <TokenSettings
          token={selectedTokenWithChanges}
          onSettingsChange={handleTokenSettingsChange}
        />
        <Button onClick={handleSave}>Save</Button>
      </Flex>
    </Modal>
  );
}

export default EditTokenModal;
