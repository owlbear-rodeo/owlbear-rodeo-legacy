import React, { useState, useEffect } from "react";
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

import { useAuth } from "../contexts/AuthContext";
import { useDatabase } from "../contexts/DatabaseContext";

import useSetting from "../hooks/useSetting";

import ConfirmModal from "./ConfirmModal";
import ImportExportModal from "./ImportExportModal";

function SettingsModal({ isOpen, onRequestClose }) {
  const { database, databaseStatus } = useDatabase();
  const { userId } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [labelSize, setLabelSize] = useSetting("map.labelSize");
  const [gridSnappingSensitivity, setGridSnappingSensitivity] = useSetting(
    "map.gridSnappingSensitivity"
  );
  const [showFogGuides, setShowFogGuides] = useSetting("fog.showGuides");
  const [fogEditOpacity, setFogEditOpacity] = useSetting("fog.editOpacity");
  const [storageEstimate, setStorageEstimate] = useState();
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
      database.close();
      await database.delete();
    } catch {
    } finally {
      window.location.reload();
    }
  }

  async function handleClearCache() {
    setIsLoading(true);
    // Clear saved settings
    localStorage.clear();

    const assets = await database
      .table("assets")
      .where("owner")
      .notEqual(userId)
      .toArray();
    const states = await database.table("states").toArray();
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
              labelFunc={(value) => `${Math.round(value * 100)}%`}
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
              labelFunc={(value) => `${value}x`}
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
              labelFunc={(value) => `${value * 2}`}
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
          {storageEstimate && (
            <Flex sx={{ justifyContent: "center" }}>
              <Text variant="caption">
                Storage Used: {prettyBytes(storageEstimate.usage)} of{" "}
                {prettyBytes(storageEstimate.quota)} (
                {Math.round(
                  (storageEstimate.usage / Math.max(storageEstimate.quota, 1)) *
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
