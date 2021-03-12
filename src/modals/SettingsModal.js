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
  const [storageEstimate, setStorageEstimate] = useState();
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

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
    localStorage.clear();
    await database.delete();
    window.location.reload();
  }

  async function handleClearCache() {
    // Clear saved settings
    localStorage.clear();
    // Clear map cache
    await database.table("maps").where("owner").notEqual(userId).delete();
    // Find all other peoples tokens who aren't benig used in a map state and delete them
    const tokens = await database
      .table("tokens")
      .where("owner")
      .notEqual(userId)
      .toArray();
    const states = await database.table("states").toArray();
    for (let token of tokens) {
      let inUse = false;
      for (let state of states) {
        for (let tokenState of Object.values(state.tokens)) {
          if (token.id === tokenState.tokenId) {
            inUse = true;
          }
        }
      }
      if (!inUse) {
        database.table("tokens").delete(token.id);
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
            <span style={{ marginRight: "4px" }}>Light theme</span>
            <Checkbox
              checked={colorMode === "light"}
              onChange={(e) =>
                setColorMode(e.target.checked ? "light" : "default")
              }
            />
          </Label>
          <Label py={2}>
            <span style={{ marginRight: "4px" }}>Show fog guides</span>
            <Checkbox
              checked={showFogGuides}
              onChange={(e) => setShowFogGuides(e.target.checked)}
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
            <Button sx={{ flexGrow: 1 }} onClick={handleClearCache}>
              Clear cache
            </Button>
          </Flex>
          <Flex py={2}>
            <Button
              sx={{ flexGrow: 1 }}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Erase all content and reset
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
