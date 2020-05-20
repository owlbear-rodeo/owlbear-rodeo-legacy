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
  }

  function handleImageUpload(file) {
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
    blobToBuffer(file).then((buffer) => {
      // Copy file to avoid permissions issues
      const blob = new Blob([buffer]);
      // Create and load the image temporarily to get its dimensions
      const url = URL.createObjectURL(blob);
      image.onload = function () {
        handleTokenAdd({
          file: buffer,
          name,
          type: "file",
          id: shortid.generate(),
          created: Date.now(),
          lastModified: Date.now(),
          owner: userId,
          defaultSize: 1,
        });
      };
      image.src = url;

      // Set file input to null to allow adding the same image 2 times in a row
      fileInputRef.current.value = null;
    });
  }

  function handleTokenSelect(token) {
    setSelectedTokenId(token.id);
  }

  async function handleTokenRemove(id) {
    await removeToken(id);
    setSelectedTokenId(null);
  }

  /**
   * Token settings
   */
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  async function handleTokenSettingsChange(key, value) {
    await updateToken(selectedTokenId, { [key]: value });
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <ImageDrop onDrop={handleImageUpload} dropText="Drop token to upload">
        <input
          onChange={(event) => handleImageUpload(event.target.files[0])}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={fileInputRef}
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
            selectedToken={selectedToken}
            onTokenSelect={handleTokenSelect}
            onTokenRemove={handleTokenRemove}
          />
          <TokenSettings
            token={selectedToken}
            showMore={showMoreSettings}
            onSettingsChange={handleTokenSettingsChange}
            onShowMoreChange={setShowMoreSettings}
          />
          <Button
            variant="primary"
            disabled={imageLoading}
            onClick={onRequestClose}
          >
            Done
          </Button>
        </Flex>
      </ImageDrop>
    </Modal>
  );
}

export default SelectTokensModal;
