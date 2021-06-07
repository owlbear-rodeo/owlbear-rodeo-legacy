import React, { useState, useRef } from "react";
import { Flex, Text } from "theme-ui";
import { useToasts } from "react-toast-notifications";

import LoadingOverlay from "../LoadingOverlay";

import ConfirmModal from "../../modals/ConfirmModal";

import { createMapFromFile } from "../../helpers/map";
import { createTokenFromFile } from "../../helpers/token";

import { useAuth } from "../../contexts/AuthContext";
import { useMapData } from "../../contexts/MapDataContext";
import { useTokenData } from "../../contexts/TokenDataContext";
import { useAssets } from "../../contexts/AssetsContext";

import useImageDrop from "../../hooks/useImageDrop";

function GlobalImageDrop({ children, onMapTokensStateCreate }) {
  const { addToast } = useToasts();

  const { userId } = useAuth();
  const { addMap } = useMapData();
  const { addToken } = useTokenData();
  const { addAssets } = useAssets();

  const [isLargeImageWarningModalOpen, setShowLargeImageWarning] = useState(
    false
  );
  const [isLoading, setIsLoading] = useState(false);

  const droppedImagesRef = useRef();
  const dropPositionRef = useRef();
  // maps or tokens
  const [droppingType, setDroppingType] = useState("maps");

  async function handleDrop(files, dropPosition) {
    if (navigator.storage) {
      // Attempt to enable persistant storage
      await navigator.storage.persist();
    }

    dropPositionRef.current = dropPosition;

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

    if (droppingType === "maps") {
      await handleMaps();
    } else {
      await handleTokens();
    }
  }

  function handleLargeImageWarningCancel() {
    droppedImagesRef.current = undefined;
    setShowLargeImageWarning(false);
  }

  async function handleLargeImageWarningConfirm() {
    setShowLargeImageWarning(false);
    if (droppingType === "maps") {
      await handleMaps();
    } else {
      await handleTokens();
    }
  }

  async function handleMaps() {
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
    setIsLoading(true);
    for (let file of droppedImagesRef.current) {
      const { token, assets } = await createTokenFromFile(file, userId);
      await addToken(token);
      await addAssets(assets);
    }
    setIsLoading(false);
    droppedImagesRef.current = undefined;
  }

  function handleMapsOver() {
    setDroppingType("maps");
  }

  function handleTokensOver() {
    setDroppingType("tokens");
  }

  const { dragging, containerListeners, overlayListeners } = useImageDrop(
    handleDrop
  );

  return (
    <Flex sx={{ height: "100%", flexGrow: 1 }} {...containerListeners}>
      {children}
      {dragging && (
        <Flex
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
            cursor: "copy",
            flexDirection: "column",
          }}
          {...overlayListeners}
        >
          <Flex
            bg="overlay"
            sx={{
              width: "100%",
              height: "20%",
              justifyContent: "center",
              alignItems: "center",
              opacity: droppingType === "maps" ? 1 : 0.5,
            }}
            onDragEnter={handleMapsOver}
          >
            <Text sx={{ pointerEvents: "none" }}>
              {"Drop image to import as a map"}
            </Text>
          </Flex>
          <Flex
            bg="overlay"
            sx={{
              width: "100%",
              height: "80%",
              justifyContent: "center",
              alignItems: "center",
              opacity: droppingType === "tokens" ? 1 : 0.5,
            }}
            onDragEnter={handleTokensOver}
          >
            <Text sx={{ pointerEvents: "none" }}>
              {"Drop image to import as a token"}
            </Text>
          </Flex>
        </Flex>
      )}
      <ConfirmModal
        isOpen={isLargeImageWarningModalOpen}
        onRequestClose={handleLargeImageWarningCancel}
        onConfirm={handleLargeImageWarningConfirm}
        confirmText="Continue"
        label="Warning"
        description="An imported image is larger than 20MB, this may cause slowness. Continue?"
      />
      {isLoading && <LoadingOverlay bg="overlay" />}
    </Flex>
  );
}

export default GlobalImageDrop;
