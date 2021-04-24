import React, { useRef, useState } from "react";
import { Flex, Label, Button } from "theme-ui";
import { v4 as uuid } from "uuid";
import Case from "case";
import { useToasts } from "react-toast-notifications";
import imageOutline from "image-outline";

import EditTokenModal from "./EditTokenModal";
import EditGroupModal from "./EditGroupModal";
import ConfirmModal from "./ConfirmModal";

import Modal from "../components/Modal";
import ImageDrop from "../components/ImageDrop";
import TokenTiles from "../components/token/TokenTiles";
import LoadingOverlay from "../components/LoadingOverlay";

import blobToBuffer from "../helpers/blobToBuffer";
import { useSearch, useGroup, handleItemSelect } from "../helpers/select";
import { createThumbnail } from "../helpers/image";
import Vector2 from "../helpers/Vector2";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

import { useTokenData } from "../contexts/TokenDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useKeyboard, useBlur } from "../contexts/KeyboardContext";
import { useAssets } from "../contexts/AssetsContext";

import shortcuts from "../shortcuts";

function SelectTokensModal({ isOpen, onRequestClose }) {
  const { addToast } = useToasts();

  const { userId } = useAuth();
  const {
    ownedTokens,
    addToken,
    removeTokens,
    updateTokens,
    tokensLoading,
  } = useTokenData();
  const { addAssets } = useAssets();

  /**
   * Search
   */
  const [search, setSearch] = useState("");
  const [filteredTokens, filteredTokenScores] = useSearch(ownedTokens, search);

  function handleSearchChange(event) {
    setSearch(event.target.value);
  }

  /**
   * Group
   */
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  async function handleTokensGroup(group) {
    setIsLoading(true);
    setIsGroupModalOpen(false);
    await updateTokens(selectedTokenIds, { group });
    setIsLoading(false);
  }

  const [tokensByGroup, tokenGroups] = useGroup(
    ownedTokens,
    filteredTokens,
    !!search,
    filteredTokenScores
  );

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
    let name = "Unknown Token";
    if (file.name) {
      // Remove file extension
      name = file.name.replace(/\.[^/.]+$/, "");
      // Removed grid size expression
      name = name.replace(/(\[ ?|\( ?)?\d+ ?(x|X) ?\d+( ?\]| ?\))?/, "");
      // Clean string
      name = name.replace(/ +/g, " ");
      name = name.trim();
      // Capitalize and remove underscores
      name = Case.capital(name);
    }
    let image = new Image();
    setIsLoading(true);
    const buffer = await blobToBuffer(file);

    // Copy file to avoid permissions issues
    const blob = new Blob([buffer]);
    // Create and load the image temporarily to get its dimensions
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      image.onload = async function () {
        let assets = [];
        const thumbnailImage = await createThumbnail(image, file.type);
        const thumbnail = { ...thumbnailImage, id: uuid(), owner: userId };
        assets.push(thumbnail);

        const fileAsset = {
          id: uuid(),
          file: buffer,
          width: image.width,
          height: image.height,
          mime: file.type,
          owner: userId,
        };
        assets.push(fileAsset);

        let outline = imageOutline(image).map(({ x, y }) => ({
          x: x / image.width,
          y: y / image.height,
        }));
        if (outline.length > 100) {
          outline = Vector2.resample(outline, 100);
        }

        const token = {
          name,
          thumbnail: thumbnail.id,
          file: fileAsset.id,
          id: uuid(),
          type: "file",
          created: Date.now(),
          lastModified: Date.now(),
          lastUsed: Date.now(),
          owner: userId,
          defaultSize: 1,
          defaultCategory: "character",
          defaultLabel: "",
          hideInSidebar: false,
          group: "",
          width: image.width,
          height: image.height,
          outline,
        };

        handleTokenAdd(token, assets);
        setIsLoading(false);
        URL.revokeObjectURL(url);
        resolve();
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  /**
   * Token controls
   */
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTokenIds, setSelectedTokenIds] = useState([]);
  const selectedTokens = ownedTokens.filter((token) =>
    selectedTokenIds.includes(token.id)
  );

  async function handleTokenAdd(token, assets) {
    await addToken(token);
    await addAssets(assets);
    setSelectedTokenIds([token.id]);
  }

  const [isTokensRemoveModalOpen, setIsTokensRemoveModalOpen] = useState(false);
  async function handleTokensRemove() {
    setIsLoading(true);
    setIsTokensRemoveModalOpen(false);
    await removeTokens(selectedTokenIds);
    setSelectedTokenIds([]);
    setIsLoading(false);
  }

  async function handleTokensHide(hideInSidebar) {
    setIsLoading(true);
    await updateTokens(selectedTokenIds, { hideInSidebar });
    setIsLoading(false);
  }

  // Either single, multiple or range
  const [selectMode, setSelectMode] = useState("single");

  async function handleTokenSelect(token) {
    handleItemSelect(
      token,
      selectMode,
      selectedTokenIds,
      setSelectedTokenIds,
      tokensByGroup,
      tokenGroups
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
      // Selected tokens and none are default
      if (
        selectedTokenIds.length > 0 &&
        !selectedTokens.some((token) => token.type === "default")
      ) {
        // Ensure all other modals are closed
        setIsEditModalOpen(false);
        setIsGroupModalOpen(false);
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
            tokens={tokensByGroup}
            groups={tokenGroups}
            onTokenAdd={openImageDialog}
            onTokenEdit={() => setIsEditModalOpen(true)}
            onTokensRemove={() => setIsTokensRemoveModalOpen(true)}
            selectedTokens={selectedTokens}
            onTokenSelect={handleTokenSelect}
            selectMode={selectMode}
            onSelectModeChange={setSelectMode}
            search={search}
            onSearchChange={handleSearchChange}
            onTokensGroup={() => setIsGroupModalOpen(true)}
            onTokensHide={handleTokensHide}
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
        tokenId={selectedTokens.length === 1 && selectedTokens[0].id}
      />
      <EditGroupModal
        isOpen={isGroupModalOpen}
        onChange={handleTokensGroup}
        groups={tokenGroups.filter(
          (group) => group !== "" && group !== "default"
        )}
        onRequestClose={() => setIsGroupModalOpen(false)}
        // Select the default group by testing whether all selected tokens are the same
        defaultGroup={
          selectedTokens.length > 0 &&
          selectedTokens
            .map((map) => map.group)
            .reduce((prev, curr) => (prev === curr ? curr : undefined))
        }
      />
      <ConfirmModal
        isOpen={isTokensRemoveModalOpen}
        onRequestClose={() => setIsTokensRemoveModalOpen(false)}
        onConfirm={handleTokensRemove}
        confirmText="Remove"
        label={`Remove ${selectedTokenIds.length} Token${
          selectedTokenIds.length > 1 ? "s" : ""
        }`}
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
