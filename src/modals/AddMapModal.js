import React, { useRef } from "react";
import { Box, Button, Image as UIImage, Flex, Label, Input } from "theme-ui";

import Modal from "../components/Modal";

function AddMapModal({
  isOpen,
  onRequestClose,
  onDone,
  onImageUpload,
  rows,
  onRowsChange,
  columns,
  onColumnsChange,
  imageLoaded,
  mapSource,
}) {
  const fileInputRef = useRef();

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }
  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <Box
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          onDone();
        }}
      >
        <Label pt={2} pb={1}>
          Add map
        </Label>
        <input
          onChange={onImageUpload}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={fileInputRef}
        />

        <Flex sx={{ flexDirection: "column" }}>
          <UIImage
            my={2}
            sx={{
              width: "500px",
              minHeight: "200px",
              maxHeight: "300px",
              objectFit: "contain",
              borderRadius: "4px",
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
                onChange={(e) => onRowsChange(e.target.value)}
              />
            </Box>
            <Box mb={2} ml={1} sx={{ flexGrow: 1 }}>
              <Label htmlFor="columns">Columns</Label>
              <Input
                type="number"
                name="columns"
                value={columns}
                onChange={(e) => onColumnsChange(e.target.value)}
              />
            </Box>
          </Flex>
          {mapSource ? (
            <Button variant="primary" disabled={!imageLoaded}>
              Done
            </Button>
          ) : (
            <Button
              varient="primary"
              onClick={(e) => {
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
  );
}

export default AddMapModal;
