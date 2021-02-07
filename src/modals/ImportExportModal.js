import React, { useRef, useState, useEffect } from "react";
import { Box, Label, Text, Button, Flex } from "theme-ui";
import { saveAs } from "file-saver";
import * as Comlink from "comlink";

import Modal from "../components/Modal";
import LoadingOverlay from "../components/LoadingOverlay";
import LoadingBar from "../components/LoadingBar";

import { useDatabase } from "../contexts/DatabaseContext";

import DatabaseWorker from "worker-loader!../workers/DatabaseWorker"; // eslint-disable-line import/no-webpack-loader-syntax

const worker = Comlink.wrap(new DatabaseWorker());

function ImportDatabaseModal({ isOpen, onRequestClose }) {
  const { database } = useDatabase();
  const [isLoading, setIsLoading] = useState(false);

  const backgroundTaskRunningRef = useRef(false);
  const fileInputRef = useRef();

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
    await database.delete();
    await worker.importData(file, Comlink.proxy(handleDBProgress));
    setIsLoading(false);
    backgroundTaskRunningRef.current = false;
    window.location.reload();
  }

  async function handleExportDatabase() {
    setIsLoading(true);
    backgroundTaskRunningRef.current = true;
    const blob = await worker.exportData(Comlink.proxy(handleDBProgress));
    saveAs(blob, `${new Date().toISOString()}.owlbear`);
    setIsLoading(false);
    backgroundTaskRunningRef.current = false;
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
          <Label>Import / Export Database</Label>
          <Text as="p" mb={2} variant="caption">
            Importing a database will overwrite your current data.
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
            <LoadingOverlay />
            <LoadingBar
              isLoading={isLoading}
              loadingProgressRef={loadingProgressRef}
            />
          </Box>
        )}
      </Flex>
    </Modal>
  );
}

export default ImportDatabaseModal;
