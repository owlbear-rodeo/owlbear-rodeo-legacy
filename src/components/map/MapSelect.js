import React from "react";
import { Flex, Image as UIImage } from "theme-ui";

import AddIcon from "../../icons/AddIcon";

function MapSelect({ maps, onMapAdd }) {
  const tileProps = {
    m: 2,
    sx: {
      width: "150px",
      height: "150px",
      borderRadius: "4px",
      justifyContent: "center",
      alignItems: "center",
    },
    bg: "muted",
  };

  function tile(map) {
    return (
      <Flex // TODO: use DB key
        key={map.source}
        {...tileProps}
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
      {maps.map(tile)}
      <Flex onClick={onMapAdd} {...tileProps}>
        <AddIcon />
      </Flex>
    </Flex>
  );
}

export default MapSelect;
