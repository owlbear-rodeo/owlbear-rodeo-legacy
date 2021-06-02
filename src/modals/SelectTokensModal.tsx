import { ChangeEvent, useRef, useState } from "react";
import { Flex, Label, Button } from "theme-ui";
import shortid from "shortid";
import Case from "case";
import { useToasts } from "react-toast-notifications";

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

import useResponsiveLayout from "../hooks/useResponsiveLayout";

import { useTokenData } from "../contexts/TokenDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useKeyboard, useBlur } from "../contexts/KeyboardContext";

import shortcuts from "../shortcuts";
import { FileToken, Token } from "../tokens";

function SelectTokensModal({ isOpen, onRequestClose }: { isOpen: boolean, onRequestClose: any }) {
  const { addToast } = useToasts();

  const { userId } = useAuth();
  const {
    ownedTokens,
    addToken,
    removeTokens,
    updateTokens,
    tokensLoading,
  } = useTokenData();

  /**
   * Search
   */
  const [search, setSearch] = useState("");
  const [filteredTokens, filteredTokenScores] = useSearch(ownedTokens, search);

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
  }

  /**
   * Group
   */
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  async function handleTokensGroup(group: string) {
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

  const fileInputRef = useRef<any>();
  const [isLoading, setIsLoading] = useState(false);

  const [isLargeImageWarningModalOpen, setShowLargeImageWarning] = useState(
    false
  );
  const largeImageWarningFiles = useRef<File[]>();

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleImagesUpload(files: FileList | null) {
    if (navigator.storage) {
      // Attempt to enable persistant storage
      await navigator.storage.persist();
    }

    // TODO: handle null files
    if (files === null) {
      return;
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
    if (!files) {
      return;
    }
    for (let file of files) {
      await handleImageUpload(file);
    }
    largeImageWarningFiles.current = undefined;
    clearFileInput();
  }

  async function handleImageUpload(file: File) {
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
        const thumbnail = await createThumbnail(image, file.type);

        handleTokenAdd({
          file: buffer,
          thumbnail,
          name,
          id: shortid.generate(),
          type: "file",
          created: Date.now(),
          lastModified: Date.now(),
          lastUsed: Date.now(),
          owner: userId,
          defaultSize: 1,
          category: "character",
          hideInSidebar: false,
          group: "",
          width: image.width,
          height: image.height,
        });
        setIsLoading(false);
        resolve(undefined);
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  /**
   * Token controls
   */
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const selectedTokens = ownedTokens.filter((token) =>
    selectedTokenIds.includes(token.id)
  );

  function handleTokenAdd(token: FileToken) {
    addToken(token);
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

  async function handleTokensHide(hideInSidebar: boolean) {
    setIsLoading(true);
    await updateTokens(selectedTokenIds, { hideInSidebar });
    setIsLoading(false);
  }

  // Either single, multiple or range
  const [selectMode, setSelectMode] = useState("single");

  async function handleTokenSelect(token: Token) {
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
  function handleKeyDown(event: KeyboardEvent) {
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

  function handleKeyUp(event: KeyboardEvent) {
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

  let tokenId;
  if (selectedTokens.length === 1 && selectedTokens[0].id) {
    tokenId = selectedTokens[0].id
  } else {
    // TODO: handle tokenId not found
    tokenId = ""
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ content: { maxWidth: layout.modalSize, width: "calc(100% - 16px)" } }}
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
      <>
      {(isLoading || tokensLoading) && <LoadingOverlay bg="overlay" />}
      </>
      <EditTokenModal
        isOpen={isEditModalOpen}
        onDone={() => setIsEditModalOpen(false)}
        tokenId={tokenId}
      />
      <EditGroupModal
        isOpen={isGroupModalOpen}
        onChange={handleTokensGroup}
        groups={tokenGroups.filter(
          (group: string) => group !== "" && group !== "default"
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
