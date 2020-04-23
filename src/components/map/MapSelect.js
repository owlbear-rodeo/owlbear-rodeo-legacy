import React from "react";
import { Flex, Image as UIImage } from "theme-ui";

import AddIcon from "../../icons/AddIcon";

function MapSelect({ maps, selectedMap, onMapSelected, onMapAdd }) {
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

  // TODO move from passing index in to using DB ID
  function tile(map, index) {
    return (
      <Flex // TODO: use DB key
        key={map.source}
        sx={{
          borderColor: "primary",
          borderStyle: index === selectedMap ? "solid" : "none",
          borderWidth: "4px",
          ...tileStyle,
        }}
        {...tileProps}
        onClick={() => onMapSelected(index)}
      >
        <UIImage
          sx={{ width: "100%", objectFit: "contain" }}
          src={map.source}
        />
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
      {maps.map((map, index) => tile(map, index))}
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
      >
        <AddIcon />
      </Flex>
    </Flex>
  );
}

export default MapSelect;
