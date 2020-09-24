import React, { useState } from "react";
import { Flex, Image as UIImage, IconButton, Box, Text } from "theme-ui";

import EditMapIcon from "../../icons/EditMapIcon";

import useDataSource from "../../helpers/useDataSource";
import { mapSources as defaultMapSources, unknownSource } from "../../maps";

function MapTile({ map, isSelected, onMapSelect, onMapEdit, onDone, large }) {
  const [isMapTileMenuOpen, setIsTileMenuOpen] = useState(false);
  const isDefault = map.type === "default";
  const mapSource = useDataSource(
    isDefault
      ? map
      : map.resolutions && map.resolutions.low
      ? map.resolutions.low
      : map,
    defaultMapSources,
    unknownSource
  );

  return (
    <Flex
      key={map.id}
      sx={{
        position: "relative",
        width: large ? "48%" : "32%",
        height: "0",
        paddingTop: large ? "48%" : "32%",
        borderRadius: "4px",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        overflow: "hidden",
      }}
      my={1}
      mx={`${large ? 1 : 2 / 3}%`}
      bg="muted"
      onClick={(e) => {
        e.stopPropagation();
        setIsTileMenuOpen(false);
        if (!isSelected) {
          onMapSelect(map);
        }
      }}
      onDoubleClick={(e) => {
        if (!isMapTileMenuOpen) {
          onDone(e);
        }
      }}
    >
      <UIImage
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        src={mapSource}
      />
      <Flex
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.65) 100%);",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
        p={2}
      >
        <Text
          as="p"
          variant="heading"
          color="hsl(210, 50%, 96%)"
          sx={{ textAlign: "center" }}
        >
          {map.name}
        </Text>
      </Flex>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          borderColor: "primary",
          borderStyle: isSelected ? "solid" : "none",
          borderWidth: "4px",
          pointerEvents: "none",
          borderRadius: "4px",
        }}
      />
      {/* Show expand button only if both reset and remove is available */}
      {isSelected && (
        <Box sx={{ position: "absolute", top: 0, right: 0 }}>
          <IconButton
            aria-label="Edit Map"
            title="Edit Map"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMapEdit(map.id);
            }}
            bg="overlay"
            sx={{ borderRadius: "50%" }}
            m={2}
          >
            <EditMapIcon />
          </IconButton>
        </Box>
      )}
    </Flex>
  );
}

export default MapTile;
