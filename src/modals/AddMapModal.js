import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Image as UIImage,
  Flex,
  Label,
  Input,
  Text,
} from "theme-ui";

import Modal from "../components/Modal";

function AddMapModal({
  isOpen,
  onRequestClose,
  onDone,
  onImageUpload,
  gridX,
  onGridXChange,
  gridY,
  onGridYChange,
  imageLoaded,
  mapSource,
}) {
  const fileInputRef = useRef();

  function handleImageUpload(file) {
    if (file.name) {
      // Match against a regex to find the grid size in the file name
      // e.g. Cave 22x23 will return [["22x22", "22", "x", "23"]]
      const gridMatches = [...file.name.matchAll(/(\d+) ?(x|X) ?(\d+)/g)];
      if (gridMatches.length > 0) {
        const lastMatch = gridMatches[gridMatches.length - 1];
        const matchX = parseInt(lastMatch[1]);
        const matchY = parseInt(lastMatch[3]);
        if (!isNaN(matchX) && !isNaN(matchY)) {
          onImageUpload(file, matchX, matchY);
          return;
        }
      }
    }
    onImageUpload(file);
  }

  function openImageDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const [dragging, setDragging] = useState(false);
  function handleImageDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  }

  function handleImageDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  }

  function handleImageDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image")) {
      handleImageUpload(file);
    }
    setDragging(false);
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <Box
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          onDone();
        }}
        onDragEnter={handleImageDragEnter}
      >
        <input
          onChange={(event) => handleImageUpload(event.target.files[0])}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={fileInputRef}
        />

        <Flex
          sx={{
            flexDirection: "column",
          }}
        >
          <Label pt={2} pb={1}>
            Add map
          </Label>
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
              <Label htmlFor="gridX">Columns</Label>
              <Input
                type="number"
                name="gridX"
                value={gridX}
                onChange={(e) => onGridXChange(e.target.value)}
              />
            </Box>
            <Box mb={2} ml={1} sx={{ flexGrow: 1 }}>
              <Label htmlFor="gridY">Rows</Label>
              <Input
                type="number"
                name="gridY"
                value={gridY}
                onChange={(e) => onGridYChange(e.target.value)}
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
          {dragging && (
            <Flex
              bg="muted"
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                cursor: "copy",
              }}
              onDragLeave={handleImageDragLeave}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={handleImageDrop}
            >
              <Text sx={{ pointerEvents: "none" }}>Drop map to upload</Text>
            </Flex>
          )}
        </Flex>
      </Box>
    </Modal>
  );
}

export default AddMapModal;
