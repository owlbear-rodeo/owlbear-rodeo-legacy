import React, { useState, useRef } from "react";
import { Box, Flex, Text } from "theme-ui";
import { useToasts } from "react-toast-notifications";

import LoadingOverlay from "../LoadingOverlay";

import ConfirmModal from "../../modals/ConfirmModal";

import { createMapFromFile } from "../../helpers/map";
import { createTokenFromFile } from "../../helpers/token";
import {
  createTokenState,
  clientPositionToMapPosition,
} from "../../helpers/token";
import Vector2 from "../../helpers/Vector2";

import { useAuth } from "../../contexts/AuthContext";
import { useMapData } from "../../contexts/MapDataContext";
import { useTokenData } from "../../contexts/TokenDataContext";
import { useAssets } from "../../contexts/AssetsContext";
import { useMapStage } from "../../contexts/MapStageContext";

import useImageDrop from "../../hooks/useImageDrop";

function GlobalImageDrop({ children, onMapChange, onMapTokensStateCreate }) {
  const { addToast } = useToasts();

  const { userId } = useAuth();
  const { addMap, getMapState } = useMapData();
  const { addToken } = useTokenData();
  const { addAssets } = useAssets();

  const mapStageRef = useMapStage();

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
    let maps = [];
    for (let file of droppedImagesRef.current) {
      const { map, assets } = await createMapFromFile(file, userId);
      await addMap(map);
      await addAssets(assets);
      maps.push(map);
    }

    // Change map if only 1 dropped
    if (maps.length === 1) {
      const mapState = await getMapState(maps[0].id);
      onMapChange(maps[0], mapState);
    }

    setIsLoading(false);
    droppedImagesRef.current = undefined;
  }

  async function handleTokens() {
    setIsLoading(true);
    // Keep track of tokens so we can add them to the map
    let tokens = [];
    for (let file of droppedImagesRef.current) {
      const { token, assets } = await createTokenFromFile(file, userId);
      await addToken(token);
      await addAssets(assets);
      tokens.push(token);
    }
    setIsLoading(false);
    droppedImagesRef.current = undefined;

    const dropPosition = dropPositionRef.current;
    const mapStage = mapStageRef.current;
    if (mapStage && dropPosition) {
      const mapPosition = clientPositionToMapPosition(mapStage, dropPosition);
      if (mapPosition) {
        let tokenStates = [];
        let offset = new Vector2(0, 0);
        for (let token of tokens) {
          if (token) {
            tokenStates.push(
              createTokenState(token, Vector2.add(mapPosition, offset), userId)
            );
            offset = Vector2.add(offset, 0.01);
          }
        }
        if (tokenStates.length > 0) {
          onMapTokensStateCreate(tokenStates);
        }
      }
    }
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
            zIndex: 100,
          }}
          {...overlayListeners}
        >
          <Flex
            sx={{
              height: "10%",
              justifyContent: "center",
              alignItems: "center",
              color: droppingType === "maps" ? "primary" : "text",
              opacity: droppingType === "maps" ? 1 : 0.8,
              width: "100%",
              position: "relative",
            }}
            onDragEnter={handleMapsOver}
          >
            <Box
              bg="overlay"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                margin: "4px 16px",
                border: "1px dashed",
                borderRadius: "12px",
                pointerEvents: "none",
              }}
            />
            <Text sx={{ pointerEvents: "none", userSelect: "none" }}>
              Drop as map
            </Text>
          </Flex>
          <Flex
            sx={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              color: droppingType === "tokens" ? "primary" : "text",
              opacity: droppingType === "tokens" ? 1 : 0.8,
              width: "100%",
              position: "relative",
            }}
            onDragEnter={handleTokensOver}
          >
            <Box
              bg="overlay"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                margin: "4px 16px",
                border: "1px dashed",
                borderRadius: "12px",
                pointerEvents: "none",
              }}
            />
            <Text sx={{ pointerEvents: "none", userSelect: "none" }}>
              Drop as token
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
