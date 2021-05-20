import React, { useRef, useState } from "react";
import { Flex, Label, Button } from "theme-ui";

import { useToasts } from "react-toast-notifications";

import EditTokenModal from "./EditTokenModal";
import ConfirmModal from "./ConfirmModal";

import Modal from "../components/Modal";
import ImageDrop from "../components/ImageDrop";
import TokenTiles from "../components/token/TokenTiles";
import LoadingOverlay from "../components/LoadingOverlay";

import {
  groupsFromIds,
  handleItemSelect,
  itemsFromGroups,
} from "../helpers/select";
import { createTokenFromFile } from "../helpers/token";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

import { useTokenData } from "../contexts/TokenDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useKeyboard, useBlur } from "../contexts/KeyboardContext";
import { useAssets } from "../contexts/AssetsContext";
import { useDatabase } from "../contexts/DatabaseContext";

import shortcuts from "../shortcuts";

function SelectTokensModal({ isOpen, onRequestClose }) {
  const { addToast } = useToasts();

  const { userId } = useAuth();
  const {
    tokens,
    addToken,
    removeTokens,
    updateTokens,
    tokensLoading,
    tokenGroups,
    updateTokenGroups,
    updateToken,
  } = useTokenData();
  const { databaseStatus } = useDatabase();
  const { addAssets } = useAssets();

  /**
   * Search
   */
  const [search, setSearch] = useState("");
  // const [filteredTokens, filteredTokenScores] = useSearch(ownedTokens, search);

  function handleSearchChange(event) {
    setSearch(event.target.value);
  }

  /**
   * Image Upload
   */

  const fileInputRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const [isLargeImageWarningModalOpen, setShowLargeImageWarning] = useState(
    false
  );
  const largeImageWarningFiles = useRef();

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleImagesUpload(files) {
    if (navigator.storage) {
      // Attempt to enable persistant storage
      await navigator.storage.persist();
    }

    let tokenFiles = [];
    for (let file of files) {
      if (file.size > 5e7) {
        addToast(`Unable to import token ${file.name} as it is over 50MB`);
      } else {
        tokenFiles.push(file);
      }
    }

    // Any file greater than 20MB
    if (tokenFiles.some((file) => file.size > 2e7)) {
      largeImageWarningFiles.current = tokenFiles;
      setShowLargeImageWarning(true);
      return;
    }

    for (let file of tokenFiles) {
      await handleImageUpload(file);
    }

    clearFileInput();
  }

  function clearFileInput() {
    // Set file input to null to allow adding the same image 2 times in a row
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  }

  function handleLargeImageWarningCancel() {
    largeImageWarningFiles.current = undefined;
    setShowLargeImageWarning(false);
    clearFileInput();
  }

  async function handleLargeImageWarningConfirm() {
    setShowLargeImageWarning(false);
    const files = largeImageWarningFiles.current;
    for (let file of files) {
      await handleImageUpload(file);
    }
    largeImageWarningFiles.current = undefined;
    clearFileInput();
  }

  async function handleImageUpload(file) {
    setIsLoading(true);
    const { token, assets } = await createTokenFromFile(file, userId);
    await addToken(token);
    await addAssets(assets);
    setIsLoading(false);
  }

  /**
   * Token controls
   */
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  function getSelectedTokens() {
    const groups = groupsFromIds(selectedGroupIds, tokenGroups);
    return itemsFromGroups(groups, tokens);
  }

  const [isTokensRemoveModalOpen, setIsTokensRemoveModalOpen] = useState(false);
  async function handleTokensRemove() {
    setIsLoading(true);
    setIsTokensRemoveModalOpen(false);
    const selectedTokens = getSelectedTokens();
    const selectedTokenIds = selectedTokens.map((token) => token.id);
    await removeTokens(selectedTokenIds);
    setSelectedGroupIds([]);
    setIsLoading(false);
  }

  async function handleTokensHide(hideInSidebar) {
    setIsLoading(true);
    const selectedTokens = getSelectedTokens();
    const selectedTokenIds = selectedTokens.map((token) => token.id);
    await updateTokens(selectedTokenIds, { hideInSidebar });
    setIsLoading(false);
  }

  // Either single, multiple or range
  const [selectMode, setSelectMode] = useState("single");

  async function handleTileSelect(item) {
    handleItemSelect(
      item,
      selectMode,
      selectedGroupIds,
      setSelectedGroupIds
      // TODO: Rework group support
    );
  }

  /**
   * Shortcuts
   */
  function handleKeyDown(event) {
    if (!isOpen) {
      return;
    }
    if (shortcuts.selectRange(event)) {
      setSelectMode("range");
    }
    if (shortcuts.selectMultiple(event)) {
      setSelectMode("multiple");
    }
    if (shortcuts.delete(event)) {
      const selectedTokens = getSelectedTokens();
      // Selected tokens and none are default
      if (
        selectedTokens.length > 0 &&
        !selectedTokens.some((token) => token.type === "default")
      ) {
        // Ensure all other modals are closed
        setIsEditModalOpen(false);
        setIsTokensRemoveModalOpen(true);
      }
    }
  }

  function handleKeyUp(event) {
    if (!isOpen) {
      return;
    }
    if (shortcuts.selectRange(event) && selectMode === "range") {
      setSelectMode("single");
    }
    if (shortcuts.selectMultiple(event) && selectMode === "multiple") {
      setSelectMode("single");
    }
  }

  useKeyboard(handleKeyDown, handleKeyUp);

  // Set select mode to single when cmd+tabing
  function handleBlur() {
    setSelectMode("single");
  }

  useBlur(handleBlur);

  const layout = useResponsiveLayout();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ maxWidth: layout.modalSize, width: "calc(100% - 16px)" }}
    >
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
            tokens={tokens}
            groups={tokenGroups}
            selectedGroupIds={selectedGroupIds}
            onTokenAdd={openImageDialog}
            onTokenEdit={() => setIsEditModalOpen(true)}
            onTokensRemove={() => setIsTokensRemoveModalOpen(true)}
            onTileSelect={handleTileSelect}
            selectMode={selectMode}
            onSelectModeChange={setSelectMode}
            search={search}
            onSearchChange={handleSearchChange}
            onTokensGroup={updateTokenGroups}
            onTokensHide={handleTokensHide}
            databaseDisabled={databaseStatus === "disabled"}
          />
          <Button
            variant="primary"
            disabled={isLoading}
            onClick={onRequestClose}
            mt={2}
          >
            Done
          </Button>
        </Flex>
      </ImageDrop>
      {(isLoading || tokensLoading) && <LoadingOverlay bg="overlay" />}
      <EditTokenModal
        isOpen={isEditModalOpen}
        onDone={() => setIsEditModalOpen(false)}
        token={
          selectedGroupIds.length === 1 &&
          tokens.find((token) => token.id === selectedGroupIds[0])
        }
        onTokenUpdate={updateToken}
      />
      <ConfirmModal
        isOpen={isTokensRemoveModalOpen}
        onRequestClose={() => setIsTokensRemoveModalOpen(false)}
        onConfirm={handleTokensRemove}
        confirmText="Remove"
        label="Remove Token(s)"
        description="This operation cannot be undone."
      />
      <ConfirmModal
        isOpen={isLargeImageWarningModalOpen}
        onRequestClose={handleLargeImageWarningCancel}
        onConfirm={handleLargeImageWarningConfirm}
        confirmText="Continue"
        label="Warning"
        description="An imported image is larger than 20MB, this may cause slowness. Continue?"
      />
    </Modal>
  );
}

export default SelectTokensModal;
