import React, { useRef, useState } from "react";
import { IconButton, Box, Button, Image, Flex, Label, Input } from "theme-ui";

import Modal from "./Modal";

const defaultMapSize = 22;

function AddMapButton({ handleMapChange }) {
  const fileInputRef = useRef();

  function openImageDialog(e) {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  function openModal() {
    setIsAddModalOpen(true);
  }
  function closeModal() {
    setIsAddModalOpen(false);
  }

  const mapDataRef = useRef(null);
  const [mapSource, setImageSource] = useState(null);
  function handleImageUpload(event) {
    mapDataRef.current = { file: event.target.files[0], rows, columns };
    setImageSource(URL.createObjectURL(mapDataRef.current.file));
  }

  function handleDone() {
    if (mapDataRef.current && mapSource) {
      handleMapChange(mapDataRef.current, mapSource);
    }
    closeModal();
  }

  const [rows, setRows] = useState(defaultMapSize);
  const [columns, setColumns] = useState(defaultMapSize);

  return (
    <>
      <IconButton aria-label="Add Map" onClick={openModal}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          fill="currentcolor"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M21.02 5H19V2.98c0-.54-.44-.98-.98-.98h-.03c-.55 0-.99.44-.99.98V5h-2.01c-.54 0-.98.44-.99.98v.03c0 .55.44.99.99.99H17v2.01c0 .54.44.99.99.98h.03c.54 0 .98-.44.98-.98V7h2.02c.54 0 .98-.44.98-.98v-.04c0-.54-.44-.98-.98-.98zM16 9.01V8h-1.01c-.53 0-1.03-.21-1.41-.58-.37-.38-.58-.88-.58-1.44 0-.36.1-.69.27-.98H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8.28c-.3.17-.64.28-1.02.28-1.09-.01-1.98-.9-1.98-1.99zM15.96 19H6c-.41 0-.65-.47-.4-.8l1.98-2.63c.21-.28.62-.26.82.02L10 18l2.61-3.48c.2-.26.59-.27.79-.01l2.95 3.68c.26.33.03.81-.39.81z" />
        </svg>
      </IconButton>
      <Modal isOpen={isAddModalOpen} onRequestClose={closeModal}>
        <Box
          as="form"
          onSubmit={e => {
            e.preventDefault();
            handleDone();
          }}
        >
          <input
            onChange={handleImageUpload}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
          />

          <Flex sx={{ flexDirection: "column" }}>
            <Image
              my={2}
              sx={{
                width: "500px",
                minHeight: "200px",
                maxHeight: "500px",
                objectFit: "contain",
                borderRadius: "4px"
              }}
              src={mapSource}
              onClick={openImageDialog}
              bg="muted"
            />
            <Flex>
              <Box mb={2} mr={1} sx={{ flexGrow: 1 }}>
                <Label htmlFor="rows">Rows</Label>
                <Input
                  type="number"
                  name="rows"
                  value={rows}
                  onChange={e => setRows(e.target.value)}
                />
              </Box>
              <Box mb={2} ml={1} sx={{ flexGrow: 1 }}>
                <Label htmlFor="columns">Columns</Label>
                <Input
                  type="number"
                  name="columns"
                  value={columns}
                  onChange={e => setColumns(e.target.value)}
                />
              </Box>
            </Flex>
            {mapSource ? (
              <Button variant="primary">Done</Button>
            ) : (
              <Button
                varient="primary"
                onClick={e => {
                  e.preventDefault();
                  openImageDialog();
                }}
              >
                Select Image
              </Button>
            )}
          </Flex>
        </Box>
      </Modal>
    </>
  );
}

export default AddMapButton;
