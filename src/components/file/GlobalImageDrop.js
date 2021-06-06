import React, { useState, useRef } from "react";
import { Box } from "theme-ui";
import { useToasts } from "react-toast-notifications";

import ImageDrop from "./ImageDrop";

import LoadingOverlay from "../LoadingOverlay";

import ImageTypeModal from "../../modals/ImageTypeModal";
import ConfirmModal from "../../modals/ConfirmModal";

import { createMapFromFile } from "../../helpers/map";
import { createTokenFromFile } from "../../helpers/token";

import { useAuth } from "../../contexts/AuthContext";
import { useMapData } from "../../contexts/MapDataContext";
import { useTokenData } from "../../contexts/TokenDataContext";
import { useAssets } from "../../contexts/AssetsContext";

function GlobalImageDrop({ children }) {
  const { addToast } = useToasts();

  const { userId } = useAuth();
  const { addMap } = useMapData();
  const { addToken } = useTokenData();
  const { addAssets } = useAssets();

  const [isImageTypeModalOpen, setIsImageTypeModalOpen] = useState(false);
  const [isLargeImageWarningModalOpen, setShowLargeImageWarning] = useState(
    false
  );
  const [isLoading, setIsLoading] = useState(false);

  const droppedImagesRef = useRef();

  async function handleDrop(files) {
    if (navigator.storage) {
      // Attempt to enable persistant storage
      await navigator.storage.persist();
    }

    droppedImagesRef.current = [];
    for (let file of files) {
      if (file.size > 5e7) {
        addToast(`Unable to import image ${file.name} as it is over 50MB`);
      } else {
        droppedImagesRef.current.push(file);
      }
    }

    // Any file greater than 20MB
    if (droppedImagesRef.current.some((file) => file.size > 2e7)) {
      setShowLargeImageWarning(true);
      return;
    }

    setIsImageTypeModalOpen(true);
  }

  function handleLargeImageWarningCancel() {
    droppedImagesRef.current = undefined;
    setShowLargeImageWarning(false);
  }

  async function handleLargeImageWarningConfirm() {
    setShowLargeImageWarning(false);
    setIsImageTypeModalOpen(true);
  }

  async function handleMaps() {
    setIsImageTypeModalOpen(false);
    setIsLoading(true);
    for (let file of droppedImagesRef.current) {
      const { map, assets } = await createMapFromFile(file, userId);
      await addMap(map);
      await addAssets(assets);
    }
    setIsLoading(false);
    droppedImagesRef.current = undefined;
  }

  async function handleTokens() {
    setIsImageTypeModalOpen(false);
    setIsLoading(true);
    for (let file of droppedImagesRef.current) {
      const { token, assets } = await createTokenFromFile(file, userId);
      await addToken(token);
      await addAssets(assets);
    }
    setIsLoading(false);
    droppedImagesRef.current = undefined;
  }

  function handleImageTypeClose() {
    droppedImagesRef.current = undefined;
    setIsImageTypeModalOpen(false);
  }

  return (
    <Box sx={{ height: "100%" }}>
      <ImageDrop onDrop={handleDrop}>{children}</ImageDrop>
      <ImageTypeModal
        isOpen={isImageTypeModalOpen}
        onMaps={handleMaps}
        onTokens={handleTokens}
        onRequestClose={handleImageTypeClose}
        multiple={droppedImagesRef.current?.length > 1}
      />
      <ConfirmModal
        isOpen={isLargeImageWarningModalOpen}
        onRequestClose={handleLargeImageWarningCancel}
        onConfirm={handleLargeImageWarningConfirm}
        confirmText="Continue"
        label="Warning"
        description="An imported image is larger than 20MB, this may cause slowness. Continue?"
      />
      {isLoading && <LoadingOverlay bg="overlay" />}
    </Box>
  );
}

export default GlobalImageDrop;
