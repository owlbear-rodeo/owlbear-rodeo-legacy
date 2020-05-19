import React, { useRef, useContext } from "react";
import { Flex, Label } from "theme-ui";

import Modal from "../components/Modal";
import ImageDrop from "../components/ImageDrop";

import TokenTiles from "../components/token/TokenTiles";

import TokenDataContext from "../contexts/TokenDataContext";

function SelectTokensModal({ isOpen, onRequestClose }) {
  const { tokens } = useContext(TokenDataContext);
  const fileInputRef = useRef();

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleImageUpload(image) {}

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
          <TokenTiles tokens={tokens} onTokenAdd={openImageDialog} />
        </Flex>
      </ImageDrop>
    </Modal>
  );
}

export default SelectTokensModal;
