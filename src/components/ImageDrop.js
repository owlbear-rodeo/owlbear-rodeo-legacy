import React, { useState } from "react";
import { Box, Flex, Text } from "theme-ui";

function ImageDrop({ onDrop, dropText, children }) {
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
      onDrop(file);
    }
    setDragging(false);
  }

  return (
    <Box onDragEnter={handleImageDragEnter}>
      {children}
      {dragging && (
        <Flex
          bg="overlay"
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
          <Text sx={{ pointerEvents: "none" }}>
            {dropText || "Drop image to upload"}
          </Text>
        </Flex>
      )}
    </Box>
  );
}

export default ImageDrop;
