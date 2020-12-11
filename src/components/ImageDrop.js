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

  async function handleImageDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    let imageFiles = [];

    // Check if the dropped image is from a URL
    const html = event.dataTransfer.getData("text/html");
    if (html) {
      try {
        const urlMatch = html.match(/src="?([^"\s]+)"?\s*/);
        const url = urlMatch[1];
        let name = "";
        const altMatch = html.match(/alt="?([^"]+)"?\s*/);
        if (altMatch && altMatch.length > 1) {
          name = altMatch[1];
        }
        const response = await fetch(url);
        if (response.ok) {
          const file = await response.blob();
          file.name = name;
          imageFiles.push(file);
        }
      } catch {}
    }

    const files = event.dataTransfer.files;
    for (let file of files) {
      if (file.type.startsWith("image")) {
        imageFiles.push(file);
      }
    }
    onDrop(imageFiles);
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
