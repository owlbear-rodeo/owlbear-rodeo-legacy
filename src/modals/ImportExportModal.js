import React, { useRef, useState, useEffect } from "react";
import { Box, Label, Text, Button, Flex } from "theme-ui";
import { saveAs } from "file-saver";
import * as Comlink from "comlink";

import Modal from "../components/Modal";
import LoadingOverlay from "../components/LoadingOverlay";
import LoadingBar from "../components/LoadingBar";
import Banner from "../components/Banner";

import DatabaseWorker from "worker-loader!../workers/DatabaseWorker"; // eslint-disable-line import/no-webpack-loader-syntax

const worker = Comlink.wrap(new DatabaseWorker());

function ImportExportModal({ isOpen, onRequestClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

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
    try {
      await worker.importData(file, Comlink.proxy(handleDBProgress));
      setIsLoading(false);
      backgroundTaskRunningRef.current = false;
      window.location.reload();
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
  }

  async function handleExportDatabase() {
    setIsLoading(true);
    backgroundTaskRunningRef.current = true;
    try {
      const blob = await worker.exportData(Comlink.proxy(handleDBProgress));
      saveAs(blob, `${new Date().toISOString()}.owlbear`);
    } catch (e) {
      setError(e);
    }
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
        <Banner isOpen={!!error} onRequestClose={() => setError()}>
          <Box p={1}>
            <Text as="p" variant="body2">
              Error: {error && error.message}
            </Text>
          </Box>
        </Banner>
      </Flex>
    </Modal>
  );
}

export default ImportExportModal;
