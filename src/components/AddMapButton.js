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
  function handleImageUpload(file) {
    const url = URL.createObjectURL(file);
    let image = new Image();
    image.onload = function () {
      mapDataRef.current = {
        file,
        rows,
        columns,
        width: image.width,
        height: image.height,
      };
      setImageLoaded(true);
    };
    image.src = url;
    setMapSource(url);
  }

  function handleDone() {
    if (mapDataRef.current && mapSource) {
      onMapChange(mapDataRef.current, mapSource);
    }
    closeModal();
  }

  const [rows, setRows] = useState(defaultMapSize);
  const [columns, setColumns] = useState(defaultMapSize);
  useEffect(() => {
    if (mapDataRef.current) {
      mapDataRef.current.rows = rows;
      mapDataRef.current.columns = columns;
    }
  }, [rows, columns]);

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
        rows={rows}
        onRowsChange={setRows}
        columns={columns}
        onColumnsChange={setColumns}
        imageLoaded={imageLoaded}
        mapSource={mapSource}
      />
    </>
  );
}

export default AddMapButton;
