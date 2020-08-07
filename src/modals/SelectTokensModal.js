import React, { useRef, useContext, useState } from "react";
import { Flex, Label, Button } from "theme-ui";
import shortid from "shortid";

import Modal from "../components/Modal";
import ImageDrop from "../components/ImageDrop";
import TokenTiles from "../components/token/TokenTiles";
import TokenSettings from "../components/token/TokenSettings";

import blobToBuffer from "../helpers/blobToBuffer";

import TokenDataContext from "../contexts/TokenDataContext";
import AuthContext from "../contexts/AuthContext";
import { isEmpty } from "../helpers/shared";

function SelectTokensModal({ isOpen, onRequestClose }) {
  const { userId } = useContext(AuthContext);
  const { ownedTokens, addToken, removeToken, updateToken } = useContext(
    TokenDataContext
  );
  const fileInputRef = useRef();

  const [imageLoading, setImageLoading] = useState(false);

  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const selectedToken = ownedTokens.find(
    (token) => token.id === selectedTokenId
  );

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleTokenAdd(token) {
    addToken(token);
    setSelectedTokenId(token.id);
  }

  async function handleImagesUpload(files) {
    for (let file of files) {
      await handleImageUpload(file);
    }
    // Set file input to null to allow adding the same image 2 times in a row
    fileInputRef.current.value = null;
  }

  async function handleImageUpload(file) {
    let name = "Unknown Map";
    if (file.name) {
      // Remove file extension
      name = file.name.replace(/\.[^/.]+$/, "");
      // Removed grid size expression
      name = name.replace(/(\[ ?|\( ?)?\d+ ?(x|X) ?\d+( ?\]| ?\))?/, "");
      // Clean string
      name = name.replace(/ +/g, " ");
      name = name.trim();
    }
    let image = new Image();
    setImageLoading(true);
    const buffer = await blobToBuffer(file);

    // Copy file to avoid permissions issues
    const blob = new Blob([buffer]);
    // Create and load the image temporarily to get its dimensions
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      image.onload = function () {
        handleTokenAdd({
          file: buffer,
          name,
          id: shortid.generate(),
          type: "file",
          created: Date.now(),
          lastModified: Date.now(),
          owner: userId,
          defaultSize: 1,
          isVehicle: false,
          hideInSidebar: false,
        });
        setImageLoading(false);
        resolve();
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  async function handleTokenSelect(token) {
    await applyTokenChanges();
    setSelectedTokenId(token.id);
  }

  async function handleTokenRemove(id) {
    await removeToken(id);
    setSelectedTokenId(null);
    setTokenSettingChanges({});
  }

  /**
   * Token settings
   */
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const [tokenSettingChanges, setTokenSettingChanges] = useState({});

  function handleTokenSettingsChange(key, value) {
    setTokenSettingChanges((prevChanges) => ({ ...prevChanges, [key]: value }));
  }

  async function applyTokenChanges() {
    if (selectedTokenId && !isEmpty(tokenSettingChanges)) {
      // Ensure size value is positive
      let verifiedChanges = { ...tokenSettingChanges };
      if ("defaultSize" in verifiedChanges) {
        verifiedChanges.defaultSize = verifiedChanges.defaultSize || 1;
      }

      await updateToken(selectedTokenId, verifiedChanges);
      setTokenSettingChanges({});
    }
  }

  async function handleRequestClose() {
    await applyTokenChanges();
    onRequestClose();
  }

  const selectedTokenWithChanges = { ...selectedToken, ...tokenSettingChanges };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleRequestClose}>
      <ImageDrop onDrop={handleImagesUpload} dropText="Drop token to upload">
        <input
          onChange={(event) => handleImagesUpload(event.target.files)}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={fileInputRef}
          multiple
        />
        <Flex
          sx={{
            flexDirection: "column",
          }}
        >
          <Label pt={2} pb={1}>
            Edit or import a token
          </Label>
          <TokenTiles
            tokens={ownedTokens}
            onTokenAdd={openImageDialog}
            selectedToken={selectedTokenWithChanges}
            onTokenSelect={handleTokenSelect}
            onTokenRemove={handleTokenRemove}
          />
          <TokenSettings
            token={selectedTokenWithChanges}
            showMore={showMoreSettings}
            onSettingsChange={handleTokenSettingsChange}
            onShowMoreChange={setShowMoreSettings}
          />
          <Button
            variant="primary"
            disabled={imageLoading}
            onClick={handleRequestClose}
          >
            Done
          </Button>
        </Flex>
      </ImageDrop>
    </Modal>
  );
}

export default SelectTokensModal;
