import React, { useRef, useState, useEffect } from "react";
import { Box, Label, Text, Button, Flex } from "theme-ui";
import { saveAs } from "file-saver";
import * as Comlink from "comlink";
import shortid from "shortid";
import { v4 as uuid } from "uuid";
import { useToasts } from "react-toast-notifications";

import Modal from "../components/Modal";
import LoadingOverlay from "../components/LoadingOverlay";
import LoadingBar from "../components/LoadingBar";
import ErrorBanner from "../components/banner/ErrorBanner";

import { useAuth } from "../contexts/AuthContext";
import { useDatabase } from "../contexts/DatabaseContext";

import SelectDataModal from "./SelectDataModal";

import { getDatabase } from "../database";

const importDBName = "OwlbearRodeoImportDB";

function ImportExportModal({ isOpen, onRequestClose }) {
  const { worker } = useDatabase();
  const { userId } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const backgroundTaskRunningRef = useRef(false);
  const fileInputRef = useRef();

  const [showImportSelector, setShowImportSelector] = useState(false);
  const [showExportSelector, setShowExportSelector] = useState(false);

  const { addToast } = useToasts();
  function addSuccessToast(message, maps, tokens) {
    const mapText = `${maps.length} map${maps.length > 1 ? "s" : ""}`;
    const tokenText = `${tokens.length} token${tokens.length > 1 ? "s" : ""}`;
    if (maps.length > 0 && tokens.length > 0) {
      addToast(`${message} ${mapText} and ${tokenText}`);
    } else if (maps.length > 0) {
      addToast(`${message} ${mapText}`);
    } else if (tokens.length > 0) {
      addToast(`${message} ${tokenText}`);
    }
  }

  function openFileDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const loadingProgressRef = useRef(0);

  function handleDBProgress({ completedRows, totalRows }) {
    loadingProgressRef.current = completedRows / totalRows;
  }

  async function handleImportDatabase(file) {
    setIsLoading(true);
    backgroundTaskRunningRef.current = true;
    try {
      await worker.importData(
        file,
        importDBName,
        Comlink.proxy(handleDBProgress)
      );

      setIsLoading(false);
      setShowImportSelector(true);
      backgroundTaskRunningRef.current = false;
    } catch (e) {
      setIsLoading(false);
      backgroundTaskRunningRef.current = false;
      if (e.message.startsWith("Max buffer length exceeded")) {
        setError(
          new Error(
            "Max image size exceeded ensure your database doesn't have an image over 100MB"
          )
        );
      } else {
        setError(e);
      }
    }
    // Set file input to null to allow adding the same data 2 times in a row
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  }

  function handleExportDatabase() {
    setShowExportSelector(true);
  }

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (backgroundTaskRunningRef.current) {
        event.returnValue =
          "Database is still processing, are you sure you want to leave?";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  function handleClose() {
    if (isLoading) {
      return;
    }
    onRequestClose();
  }

  async function handleImportSelectorClose() {
    const importDB = getDatabase({ addons: [] }, importDBName);
    await importDB.delete();
    importDB.close();
    setShowImportSelector(false);
  }

  async function handleImportSelectorConfirm(checkedMaps, checkedTokens) {
    setIsLoading(true);
    backgroundTaskRunningRef.current = true;
    setShowImportSelector(false);
    loadingProgressRef.current = 0;

    const importDB = getDatabase({ addons: [] }, importDBName);
    const db = getDatabase({});
    try {
      // Keep track of a mapping of old token ids to new ones to apply them to the map states
      let newTokenIds = {};
      // Mapping of old asset ids to new asset ids
      let newAssetIds = {};
      if (checkedTokens.length > 0) {
        const tokenIds = checkedTokens.map((token) => token.id);
        const tokensToAdd = await importDB.table("tokens").bulkGet(tokenIds);
        let newTokens = [];
        for (let token of tokensToAdd) {
          // Generate new ids
          const newId = uuid();
          newTokenIds[token.id] = newId;
          const newFileId = uuid();
          const newThumbnailId = uuid();
          newAssetIds[token.file] = newFileId;
          newAssetIds[token.thumbnail] = newThumbnailId;

          // Change ids and owner
          newTokens.push({
            ...token,
            id: newId,
            owner: userId,
            file: newFileId,
            thumbnail: newThumbnailId,
          });
        }
        await db.table("tokens").bulkAdd(newTokens);
      }

      if (checkedMaps.length > 0) {
        const mapIds = checkedMaps.map((map) => map.id);
        const mapsToAdd = await importDB.table("maps").bulkGet(mapIds);
        let newMaps = [];
        let newStates = [];
        for (let map of mapsToAdd) {
          let state = await importDB.table("states").get(map.id);
          // Apply new token ids to imported state
          for (let tokenState of Object.values(state.tokens)) {
            if (tokenState.tokenId in newTokenIds) {
              state.tokens[tokenState.id].tokenId =
                newTokenIds[tokenState.tokenId];
            }
            if (tokenState.type === "file" && tokenState.file in newAssetIds) {
              state.tokens[tokenState.id].file = newAssetIds[tokenState.file];
            }
          }
          // Generate new ids
          const newId = uuid();
          const newFileId = uuid();
          const newThumbnailId = uuid();
          newAssetIds[map.file] = newFileId;
          newAssetIds[map.thumbnail] = newThumbnailId;
          const newResolutionIds = {};
          for (let res of Object.keys(map.resolutions)) {
            newResolutionIds[res] = uuid();
            newAssetIds[map.resolutions[res]] = newResolutionIds[res];
          }
          // Change ids and owner
          newMaps.push({
            ...map,
            id: newId,
            owner: userId,
            file: newFileId,
            thumbnail: newThumbnailId,
            resolutions: newResolutionIds,
          });
          newStates.push({ ...state, mapId: newId });
        }
        await db.table("maps").bulkAdd(newMaps);
        await db.table("states").bulkAdd(newStates);
      }
      // Add assets with new ids
      const assetsToAdd = await importDB
        .table("assets")
        .bulkGet(Object.keys(newAssetIds));
      let assets = [];
      for (let asset of assetsToAdd) {
        assets.push({ ...asset, id: newAssetIds[asset.id] });
      }
      await db.table("assets").bulkAdd(assets);
      addSuccessToast("Imported", checkedMaps, checkedTokens);
    } catch (e) {
      console.error(e);
      setError(new Error("Unable to import data"));
    }
    await importDB.delete();
    importDB.close();
    db.close();
    setIsLoading(false);
    backgroundTaskRunningRef.current = false;
  }

  function exportSelectorFilter(table, value) {
    // Only show owned maps and tokens
    if (table === "maps" || table === "tokens") {
      if (value.owner === userId) {
        return true;
      }
    }
    // Allow all states so tokens can be checked against maps
    if (table === "states") {
      return true;
    }
    return false;
  }

  async function handleExportSelectorClose() {
    setShowExportSelector(false);
  }

  async function handleExportSelectorConfirm(checkedMaps, checkedTokens) {
    setShowExportSelector(false);
    setIsLoading(true);
    backgroundTaskRunningRef.current = true;

    const mapIds = checkedMaps.map((map) => map.id);
    const tokenIds = checkedTokens.map((token) => token.id);

    try {
      const buffer = await worker.exportData(
        Comlink.proxy(handleDBProgress),
        mapIds,
        tokenIds
      );
      const blob = new Blob([buffer]);
      saveAs(blob, `${shortid.generate()}.owlbear`);
      addSuccessToast("Exported", checkedMaps, checkedTokens);
    } catch (e) {
      setError(e);
    }
    setIsLoading(false);
    backgroundTaskRunningRef.current = false;
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} allowClose={!isLoading}>
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "300px",
          flexGrow: 1,
        }}
        m={2}
      >
        <Box>
          <Label>Import / Export</Label>
          <Text as="p" mb={2} variant="caption">
            Select import or export then select the data you wish to use
          </Text>
          <input
            onChange={(event) => handleImportDatabase(event.target.files[0])}
            type="file"
            accept=".owlbear"
            style={{ display: "none" }}
            ref={fileInputRef}
          />
          <Flex>
            <Button mr={1} sx={{ flexGrow: 1 }} onClick={openFileDialog}>
              Import
            </Button>
            <Button ml={1} sx={{ flexGrow: 1 }} onClick={handleExportDatabase}>
              Export
            </Button>
          </Flex>
        </Box>
        {isLoading && (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <LoadingOverlay bg="overlay" />
            <Box sx={{ zIndex: 3, position: "absolute", width: "100%" }}>
              <LoadingBar
                isLoading={isLoading}
                loadingProgressRef={loadingProgressRef}
              />
            </Box>
          </Box>
        )}
        <ErrorBanner error={error} onRequestClose={() => setError()} />
        <SelectDataModal
          isOpen={showImportSelector}
          onRequestClose={handleImportSelectorClose}
          onConfirm={handleImportSelectorConfirm}
          databaseName={importDBName}
          confirmText="Import"
          label="Select data to import"
        />
        <SelectDataModal
          isOpen={showExportSelector}
          onRequestClose={handleExportSelectorClose}
          onConfirm={handleExportSelectorConfirm}
          confirmText="Export"
          label="Select data to export"
          filter={exportSelectorFilter}
        />
      </Flex>
    </Modal>
  );
}

export default ImportExportModal;
