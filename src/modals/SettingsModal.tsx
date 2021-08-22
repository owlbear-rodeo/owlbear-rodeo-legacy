import { useState, useEffect } from "react";
import {
  Label,
  Flex,
  Button,
  useColorMode,
  Checkbox,
  Divider,
  Text,
} from "theme-ui";
import prettyBytes from "pretty-bytes";

import Modal from "../components/Modal";
import Slider from "../components/Slider";
import LoadingOverlay from "../components/LoadingOverlay";

import { useUserId } from "../contexts/UserIdContext";
import { useDatabase } from "../contexts/DatabaseContext";

import useSetting from "../hooks/useSetting";

import ConfirmModal from "./ConfirmModal";
import ImportExportModal from "./ImportExportModal";

import { MapState } from "../types/MapState";
import { RequestCloseEventHandler } from "../types/Events";

type SettingsModalProps = {
  isOpen: boolean;
  onRequestClose: RequestCloseEventHandler;
};

function SettingsModal({ isOpen, onRequestClose }: SettingsModalProps) {
  const { database, databaseStatus } = useDatabase();
  const userId = useUserId();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [labelSize, setLabelSize] = useSetting<number>("map.labelSize");
  const [gridSnappingSensitivity, setGridSnappingSensitivity] =
    useSetting<number>("map.gridSnappingSensitivity");
  const [showFogGuides, setShowFogGuides] =
    useSetting<boolean>("fog.showGuides");
  const [fogEditOpacity, setFogEditOpacity] =
    useSetting<number>("fog.editOpacity");
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate>();
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function estimateStorage() {
      // Persisted data on firefox doesn't count towards the usage quota so ignore it
      const persisted = await navigator.storage.persisted();
      const isFirefox =
        navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
      if (persisted && isFirefox) {
        return;
      }

      const estimate = await navigator.storage.estimate();
      setStorageEstimate(estimate);
    }

    if (isOpen && navigator.storage) {
      estimateStorage();
    }
  }, [isOpen]);

  async function handleEraseAllData() {
    setIsLoading(true);
    try {
      localStorage.clear();
      database?.close();
      await database?.delete();
    } catch {
    } finally {
      window.location.reload();
    }
  }

  async function handleClearCache() {
    setIsLoading(true);
    // Clear saved settings
    localStorage.clear();

    if (database && userId) {
      const assets = await database
        .table("assets")
        .where("owner")
        .notEqual(userId)
        .toArray();
      const states: MapState[] = await database.table("states").toArray();
      for (let asset of assets) {
        let inUse = false;
        for (let state of states) {
          for (let tokenState of Object.values(state.tokens)) {
            if (tokenState.type === "file" && asset.id === tokenState.file) {
              inUse = true;
            }
          }
        }
        if (!inUse) {
          await database.table("assets").delete(asset.id);
        }
      }

      // TODO: Remove this when 1.11 comes out
      // Hack to fix broken database upgrade
      for (let state of states) {
        if ((state as any).drawShapes) {
          await database.table("states").update(state.mapId, {
            drawShapes: undefined,
            drawings: (state as any).drawShapes,
          });
        }

        if ((state as any).fogShapes) {
          await database.table("states").update(state.mapId, {
            fogShapes: undefined,
            fogs: (state as any).fogShapes,
          });
        }
      }
    }

    window.location.reload();
  }

  const [colorMode, setColorMode] = useColorMode();

  return (
    <>
      <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
        <Flex sx={{ flexDirection: "column" }}>
          <Label py={2}>Settings</Label>
          <Divider bg="text" />
          <Label py={2}>Accessibility:</Label>
          <Label py={2}>
            <span style={{ marginRight: "4px" }}>Light Theme</span>
            <Checkbox
              checked={colorMode === "light"}
              onChange={(e) =>
                setColorMode(e.target.checked ? "light" : "default")
              }
            />
          </Label>
          <Label py={2}>
            <span style={{ marginRight: "4px" }}>Show Fog Guides</span>
            <Checkbox
              checked={showFogGuides}
              onChange={(e) => setShowFogGuides(e.target.checked)}
            />
          </Label>
          <Label py={2}>
            Fog Edit Opacity
            <Slider
              step={0.05}
              min={0}
              max={1}
              ml={1}
              sx={{ width: "initial" }}
              value={fogEditOpacity}
              onChange={(e) => setFogEditOpacity(parseFloat(e.target.value))}
              labelFunc={(value: number) => `${Math.round(value * 100)}%`}
            />
          </Label>
          <Label py={2}>
            Token Label Size
            <Slider
              step={0.5}
              min={1}
              max={3}
              ml={1}
              sx={{ width: "initial" }}
              value={labelSize}
              onChange={(e) => setLabelSize(parseFloat(e.target.value))}
              labelFunc={(value: number) => `${value}x`}
            />
          </Label>
          <Label py={2}>
            Grid Snapping Sensitivity
            <Slider
              step={0.05}
              min={0}
              max={0.5}
              ml={1}
              sx={{ width: "initial" }}
              value={gridSnappingSensitivity}
              onChange={(e) =>
                setGridSnappingSensitivity(parseFloat(e.target.value))
              }
              labelFunc={(value: number) => `${value * 2}`}
            />
          </Label>
          <Divider bg="text" />
          <Flex py={2}>
            <Button
              sx={{ flexGrow: 1 }}
              onClick={handleClearCache}
              disabled={!database}
            >
              Clear Cache
            </Button>
          </Flex>
          <Flex py={2}>
            <Button
              sx={{ flexGrow: 1 }}
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={!database}
            >
              Erase All Content and Reset
            </Button>
          </Flex>
          <Flex py={2}>
            <Button
              sx={{ flexGrow: 1 }}
              onClick={() => setIsImportExportModalOpen(true)}
              disabled={databaseStatus !== "loaded"}
            >
              Import / Export Data
            </Button>
          </Flex>
          {storageEstimate! && (
            <Flex sx={{ justifyContent: "center" }}>
              <Text variant="caption">
                Storage Used: {prettyBytes(storageEstimate.usage as number)} of{" "}
                {prettyBytes(storageEstimate.quota as number)} (
                {Math.round(
                  ((storageEstimate.usage as number) /
                    Math.max(storageEstimate.quota as number, 1)) *
                    100
                )}
                %)
              </Text>
            </Flex>
          )}
          {isLoading && <LoadingOverlay bg="overlay" />}
        </Flex>
      </Modal>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleEraseAllData}
        label="Erase All Content?"
        description="This will remove all data including saved maps and tokens."
        confirmText="Erase"
      />
      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onRequestClose={() => setIsImportExportModalOpen(false)}
      />
    </>
  );
}

export default SettingsModal;
