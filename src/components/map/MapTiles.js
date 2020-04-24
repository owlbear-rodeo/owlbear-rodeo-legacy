import React from "react";
import { Flex } from "theme-ui";
import SimpleBar from "simplebar-react";

import AddIcon from "../../icons/AddIcon";

import MapTile from "./MapTile";

function MapTiles({
  maps,
  selectedMap,
  onMapSelect,
  onMapAdd,
  onMapRemove,
  onMapReset,
  onSubmit,
}) {
  return (
    <SimpleBar style={{ maxHeight: "300px", width: "500px" }}>
      <Flex
        py={2}
        bg="muted"
        sx={{
          flexWrap: "wrap",
          width: "500px",
          borderRadius: "4px",
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
            width: "150px",
            height: "150px",
            borderRadius: "4px",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
          m={2}
          bg="muted"
          aria-label="Add Map"
          title="Add Map"
        >
          <AddIcon large />
        </Flex>
        {maps.map((map) => (
          <MapTile
            key={map.id}
            map={map}
            isSelected={map.id === selectedMap}
            onMapSelect={onMapSelect}
            onMapRemove={onMapRemove}
            onMapReset={onMapReset}
            onSubmit={onSubmit}
          />
        ))}
      </Flex>
    </SimpleBar>
  );
}

export default MapTiles;
