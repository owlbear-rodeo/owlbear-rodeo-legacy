import React, { useRef, useState, useEffect } from "react";
import { IconButton } from "theme-ui";

import AddMapModal from "../modals/AddMapModal";
import AddMapIcon from "../icons/AddMapIcon";

const defaultMapSize = 22;

function AddMapButton({ onMapChange }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  function openModal() {
    setIsAddModalOpen(true);
  }
  function closeModal() {
    setIsAddModalOpen(false);
  }

  const [imageLoaded, setImageLoaded] = useState(false);

  const mapDataRef = useRef(null);
  const [mapSource, setMapSource] = useState(null);
  function handleImageUpload(file, fileGridX, fileGridY) {
    const url = URL.createObjectURL(file);
    let image = new Image();
    image.onload = function () {
      mapDataRef.current = {
        file,
        gridX: fileGridX || gridX,
        gridY: fileGridY || gridY,
        width: image.width,
        height: image.height,
      };
      setImageLoaded(true);
    };
    image.src = url;
    setMapSource(url);
    if (fileGridX) {
      setGridX(fileGridX);
    }
    if (fileGridY) {
      setGridY(fileGridY);
    }
  }

  function handleDone() {
    if (mapDataRef.current && mapSource) {
      onMapChange(mapDataRef.current, mapSource);
    }
    closeModal();
  }

  const [gridX, setGridX] = useState(defaultMapSize);
  const [gridY, setGridY] = useState(defaultMapSize);
  useEffect(() => {
    if (mapDataRef.current) {
      mapDataRef.current.gridX = gridX;
      mapDataRef.current.gridY = gridY;
    }
  }, [gridX, gridY]);

  return (
    <>
      <IconButton aria-label="Add Map" title="Add Map" onClick={openModal}>
        <AddMapIcon />
      </IconButton>
      <AddMapModal
        isOpen={isAddModalOpen}
        onRequestClose={closeModal}
        onDone={handleDone}
        onImageUpload={handleImageUpload}
        gridX={gridX}
        onGridXChange={setGridX}
        gridY={gridY}
        onGridYChange={setGridY}
        imageLoaded={imageLoaded}
        mapSource={mapSource}
      />
    </>
  );
}

export default AddMapButton;
