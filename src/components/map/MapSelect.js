import React from "react";
import { Flex, Image as UIImage, IconButton } from "theme-ui";

import AddIcon from "../../icons/AddIcon";
import RemoveIcon from "../../icons/RemoveIcon";

function MapSelect({ maps, selectedMap, onMapSelect, onMapAdd, onMapRemove }) {
  const tileProps = {
    m: 2,
    bg: "muted",
  };

  const tileStyle = {
    width: "150px",
    height: "150px",
    borderRadius: "4px",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  };

  function tile(map) {
    return (
      <Flex
        key={map.id}
        sx={{
          borderColor: "primary",
          borderStyle: map.id === selectedMap ? "solid" : "none",
          borderWidth: "4px",
          position: "relative",
          ...tileStyle,
        }}
        {...tileProps}
        onClick={() => onMapSelect(map)}
      >
        <UIImage
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
          src={map.source}
        />
        {!map.default && map.id === selectedMap && (
          <IconButton
            aria-label="Remove Map"
            title="Remove map"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMapRemove(map.id);
            }}
            sx={{ position: "absolute", top: 0, right: 0 }}
          >
            <RemoveIcon />
          </IconButton>
        )}
      </Flex>
    );
  }

  return (
    <Flex
      my={2}
      bg="muted"
      sx={{
        flexWrap: "wrap",
        width: "500px",
        maxHeight: "300px",
        borderRadius: "4px",
        // TODO: move to simple scroll
        overflowY: "scroll",
        flexGrow: 1,
      }}
    >
      <Flex
        onClick={onMapAdd}
        sx={{
          ":hover": {
            color: "primary",
          },
          ":focus": {
            outline: "none",
          },
          ":active": {
            color: "secondary",
          },
          ...tileStyle,
        }}
        {...tileProps}
        aria-label="Add Map"
        title="Add Map"
      >
        <AddIcon />
      </Flex>
      {maps.map(tile)}
    </Flex>
  );
}

export default MapSelect;
