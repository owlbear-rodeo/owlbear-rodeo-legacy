import { useRef, useState, useEffect } from "react";
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

import { useUserId } from "../contexts/UserIdContext";
import { useDatabase } from "../contexts/DatabaseContext";

import SelectDataModal, { SelectData } from "./SelectDataModal";

import { getDatabase } from "../database";
import { Map } from "../types/Map";
import { MapState } from "../types/MapState";
import { Token } from "../types/Token";
import { Group } from "../types/Group";
import { RequestCloseEventHandler } from "../types/Events";
import { Asset } from "../types/Asset";

const importDBName = "OwlbearRodeoImportDB";

class MissingAssetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingAssetError";
  }
}

function ImportExportModal({
  isOpen,
  onRequestClose,
}: {
  isOpen: boolean;
  onRequestClose: RequestCloseEventHandler;
}) {
  const { worker } = useDatabase();
  const userId = useUserId();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const backgroundTaskRunningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showImportSelector, setShowImportSelector] = useState(false);
  const [showExportSelector, setShowExportSelector] = useState(false);

  const { addToast } = useToasts();
  function addSuccessToast(
    message: string,
    maps: number,
    tokens: number
  ) {
    const mapText = `${maps} map${maps > 1 ? "s" : ""}`;
    const tokenText = `${tokens} token${tokens > 1 ? "s" : ""}`;
    if (maps > 0 && tokens > 0) {
      addToast(`${message} ${mapText} and ${tokenText}`);
    } else if (maps > 0) {
      addToast(`${message} ${mapText}`);
    } else if (tokens > 0) {
      addToast(`${message} ${tokenText}`);
    }
  }

  function addWarningToast(
    message: string,
    items: string[],
  ) {
    let text = "";

    if (items.length > 0) {
      if (items.length === 1) {
        text += `${items[0]}`
      } else {
        for (let item in items) {
          text += `${items[item]}, `
        }
        text = text.replace(/,\s*$/, "");
      }
    }
    const toastMessage = <span>{message} <b>{text}</b></span>
    addToast(toastMessage, { appearance: "warning", autoDismiss: true });
  }

  function openFileDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const loadingProgressRef = useRef(0);

  function handleDBProgress({
    completedRows,
    totalRows,
  }: {
    completedRows: number;
    totalRows: number;
  }) {
    loadingProgressRef.current = completedRows / totalRows;
  }

  async function handleImportDatabase(file: File) {
    setIsLoading(true);
    backgroundTaskRunningRef.current = true;
    try {
      await worker.importData(
        file,
        importDBName,
        Comlink.proxy(handleDBProgress) as any
      );

      setIsLoading(false);
      setShowImportSelector(true);
      backgroundTaskRunningRef.current = false;
    } catch (e) {
      setIsLoading(false);
      backgroundTaskRunningRef.current = false;
      if (e instanceof (Error)) {
        if (e.message.startsWith("Max buffer length exceeded")) {
          setError(
            new Error(
              "Max image size exceeded ensure your database doesn't have an image over 100MB"
            )
          );
        } else {
          console.error(e);
          setError(e);
        }
      }
    }
    // Set file input to null to allow adding the same data 2 times in a row
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleExportDatabase() {
    setShowExportSelector(true);
  }

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
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

  async function handleImportSelectorConfirm(
    checkedMaps: SelectData[],
    checkedTokens: SelectData[],
    checkedMapGroups: Group[],
    checkedTokenGroups: Group[]
  ) {
    setIsLoading(true);
    backgroundTaskRunningRef.current = true;
    setShowImportSelector(false);
    loadingProgressRef.current = 0;

    const importDB = getDatabase({ addons: [] }, importDBName);
    const db = getDatabase({});
    try {
      // Keep track of a mapping of old token ids to new ones to apply them to the map states
      let newTokenIds: Record<string, string> = {};
      // Mapping of old asset ids to new asset ids
      let newAssetIds: Record<string, string> = {};
      // Mapping of old asset ids to old maps
      let oldAssetIds: Record<string, { itemName: string, item: "map" | "token", assetType: string }> = {};

      // Mapping of old maps ids to new map ids
      let newMapIds: Record<string, string> = {};

      let newTokens: Token[] = [];
      if (checkedTokens.length > 0) {
        const tokenIds = checkedTokens.map((token) => token.id);
        const tokensToAdd: Token[] | undefined = await importDB.table("tokens").bulkGet(tokenIds);

        if (tokensToAdd) {
          for (let token of tokensToAdd) {
            if (token) {
              // Generate new ids
              const newId = uuid();
              newTokenIds[token.id] = newId;

              if (token.type === "default") {
                if (userId) {
                  newTokens.push({ ...token, id: newId, owner: userId });
                }
              } else {
                const newFileId = uuid();
                const newThumbnailId = uuid();
                newAssetIds[token.file] = newFileId;
                newAssetIds[token.thumbnail] = newThumbnailId;

                oldAssetIds[token.file] = { itemName: token.name, item: "token", assetType: "file" };
                oldAssetIds[token.thumbnail] = { itemName: token.name, item: "token", assetType: "thumbnail" };

                // Change ids and owner
                if (userId) {
                  newTokens.push({
                    ...token,
                    id: newId,
                    owner: userId,
                    file: newFileId,
                    thumbnail: newThumbnailId,
                  });
                }
              }
            }
          }
        }
      }

      let newMaps: Map[] = [];
      let newStates: MapState[] = [];
      if (checkedMaps.length > 0) {
        const mapIds = checkedMaps.map((map) => map.id);
        const mapsToAdd = await importDB.table("maps").bulkGet(mapIds);
        if (mapsToAdd) {

          for (let map of mapsToAdd) {
            if (map) {
              let state: MapState = await importDB.table("states").get(map.id);
              // Apply new token ids to imported state
              for (let tokenState of Object.values(state.tokens)) {
                if (tokenState.tokenId in newTokenIds) {
                  tokenState.tokenId = newTokenIds[tokenState.tokenId];
                }
                // Change token state file asset id
                if (tokenState.type === "file" && tokenState.file in newAssetIds) {
                  tokenState.file = newAssetIds[tokenState.file];
                }
                // Change token state owner if owned by the user of the map
                if (tokenState.owner === map.owner && userId) {
                  tokenState.owner = userId;
                }
              }
              // Generate new ids
              const newId = uuid();
              newMapIds[map.id] = newId;

              if (map.type === "default") {
                if (userId) {
                  newMaps.push({ ...map, id: newId, owner: userId });
                }
              } else {
                const newFileId = uuid();
                const newThumbnailId = uuid();
                newAssetIds[map.file] = newFileId;
                newAssetIds[map.thumbnail] = newThumbnailId;

                oldAssetIds[map.file] = { itemName: map.name, item: "map", assetType: "file" };
                oldAssetIds[map.thumbnail] = { itemName: map.name, item: "map", assetType: "thumbnail" };

                const newResolutionIds: Record<string, string> = {};
                for (let res of Object.keys(map.resolutions)) {
                  newResolutionIds[res] = uuid();
                  newAssetIds[map.resolutions[res]] = newResolutionIds[res];
                  oldAssetIds[map.resolutions[res]] = { itemName: map.name, item: "map", assetType: "resolution" };
                }

                if (userId) {
                  // Change ids and owner
                  newMaps.push({
                    ...map,
                    id: newId,
                    owner: userId,
                    file: newFileId,
                    thumbnail: newThumbnailId,
                    resolutions: newResolutionIds,
                  });
                }
              }

              newStates.push({ ...state, mapId: newId });
            }
          }
        }
      }

      // Add assets with new ids
      const assetsToAdd: Asset[] | undefined = await importDB
        .table("assets")
        .bulkGet(Object.keys(newAssetIds));
      let newAssets: Asset[] = [];
      const processedAssetIds: string[] = []
      if (assetsToAdd) {
        for (let asset of assetsToAdd) {
          if (asset && userId) {
            newAssets.push({
              ...asset,
              id: newAssetIds[asset.id],
              owner: userId,
            });
            processedAssetIds.push(asset.id)
          }
        }
      }

      const unprocessedAssets = Object.keys(newAssetIds).filter(item => processedAssetIds.indexOf(item) < 0);
      let unprocessedMaps = 0
      let unprocessedTokens = 0
      if (unprocessedAssets.length > 0) {
        const unprocessedItems: string[] = []
        for (let item of unprocessedAssets) {
          let unprocessedItem = oldAssetIds[item]

          if (!unprocessedItems.includes(unprocessedItem.itemName)) {
            unprocessedItems.push(unprocessedItem.itemName)
            if (unprocessedItem.item === "map") {
              unprocessedMaps += 1
            } else if (unprocessedItem.item === "token") {
              unprocessedTokens += 1
            }
          }
        }

        addWarningToast("Could not import item(s)", unprocessedItems)
      }

      // Add map groups with new ids
      let newMapGroups: Group[] = [];
      if (checkedMapGroups.length > 0) {
        for (let group of checkedMapGroups) {
          if (group.type === "item") {
            newMapGroups.push({ ...group, id: newMapIds[group.id] });
          } else {
            newMapGroups.push({
              ...group,
              id: uuid(),
              items: group.items.map((item) => ({
                ...item,
                id: newMapIds[item.id],
              })),
            });
          }
        }
      }

      // Add token groups with new ids
      let newTokenGroups: Group[] = [];
      if (checkedTokenGroups.length > 0) {
        for (let group of checkedTokenGroups) {
          if (group.type === "item") {
            newTokenGroups.push({ ...group, id: newTokenIds[group.id] });
          } else {
            newTokenGroups.push({
              ...group,
              id: uuid(),
              items: group.items.map((item) => ({
                ...item,
                id: newTokenIds[item.id],
              })),
            });
          }
        }
      }

      db.transaction(
        "rw",
        [
          db.table("tokens"),
          db.table("maps"),
          db.table("states"),
          db.table("assets"),
          db.table("groups"),
        ],
        async () => {
          if (newTokens.length > 0) {
            await db.table<Token>("tokens").bulkAdd(newTokens);
          }
          if (newMaps.length > 0) {
            await db.table<Map>("maps").bulkAdd(newMaps);
          }
          if (newStates.length > 0) {
            await db.table("states").bulkAdd(newStates);
          }
          if (newAssets.length > 0) {
            await db.table<Asset>("assets").bulkAdd(newAssets);
          }
          if (newMapGroups.length > 0) {
            const mapGroup = await db.table("groups").get("maps");
            await db
              .table<Group>("groups")
              .update("maps", { items: [...newMapGroups, ...mapGroup.items] });
          }
          if (newTokenGroups.length > 0) {
            const tokenGroup = await db.table("groups").get("tokens");
            await db.table<Group>("groups").update("tokens", {
              items: [...newTokenGroups, ...tokenGroup.items],
            });
          }
        }
      );
      const totalImportedMaps = checkedMaps.length - unprocessedMaps
      const totalImportedTokens = checkedTokens.length - unprocessedTokens
      addSuccessToast("Imported", totalImportedMaps, totalImportedTokens);
    } catch (e) {
      console.error(e);
      if (e instanceof MissingAssetError) {
        setError(e);
      } else {
        setError(new Error("Unable to import data"));
      }
    }
    await importDB.delete();
    importDB.close();
    setIsLoading(false);
    backgroundTaskRunningRef.current = false;
  }

  function exportSelectorFilter(table: string) {
    return (
      table === "maps" ||
      table === "tokens" ||
      table === "states" ||
      table === "groups"
    );
  }

  async function handleExportSelectorClose() {
    setShowExportSelector(false);
  }

  async function handleExportSelectorConfirm(
    checkedMaps: SelectData[],
    checkedTokens: SelectData[]
  ) {
    setShowExportSelector(false);
    setIsLoading(true);
    backgroundTaskRunningRef.current = true;

    const mapIds = checkedMaps.map((map) => map.id);
    const tokenIds = checkedTokens.map((token) => token.id);

    try {
      const buffer = await worker.exportData(
        Comlink.proxy(handleDBProgress) as any,
        mapIds,
        tokenIds
      );
      const blob = new Blob([buffer]);
      saveAs(blob, `${shortid.generate()}.owlbear`);
      addSuccessToast("Exported", checkedMaps.length, checkedTokens.length);
    } catch (e: unknown) {
      if (e instanceof (Error)) {
        console.error(e);
        setError(e);
      }
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
            onChange={(event) =>
              event.target.files && handleImportDatabase(event.target.files[0])
            }
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
        <ErrorBanner error={error} onRequestClose={() => setError(undefined)} />
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
