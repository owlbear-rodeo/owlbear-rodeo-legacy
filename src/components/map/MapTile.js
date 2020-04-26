import React, { useState } from "react";
import { Flex, Image as UIImage, IconButton, Box, Text } from "theme-ui";

import RemoveMapIcon from "../../icons/RemoveMapIcon";
import ResetMapIcon from "../../icons/ResetMapIcon";
import ExpandMoreDotIcon from "../../icons/ExpandMoreDotIcon";

import useDataSource from "../../helpers/useDataSource";
import { mapSources as defaultMapSources } from "../../maps";

function MapTile({
  map,
  mapState,
  isSelected,
  onMapSelect,
  onMapRemove,
  onMapReset,
  onSubmit,
}) {
  const mapSource = useDataSource(map, defaultMapSources);
  const [isMapTileMenuOpen, setIsTileMenuOpen] = useState(false);
  const isDefault = map.type === "default";
  const hasMapState =
    mapState &&
    (Object.values(mapState.tokens).length > 0 ||
      mapState.drawActions.length > 0);

  const expandButton = (
    <IconButton
      aria-label="Show Map Actions"
      title="Show Map Actions"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsTileMenuOpen(true);
      }}
      bg="overlay"
      sx={{ borderRadius: "50%" }}
      m={1}
    >
      <ExpandMoreDotIcon />
    </IconButton>
  );

  function removeButton(map) {
    return (
      <IconButton
        aria-label="Remove Map"
        title="Remove Map"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsTileMenuOpen(false);
          onMapRemove(map.id);
        }}
        bg="overlay"
        sx={{ borderRadius: "50%" }}
        m={1}
      >
        <RemoveMapIcon />
      </IconButton>
    );
  }

  function resetButton(map) {
    return (
      <IconButton
        aria-label="Reset Map"
        title="Reset Map"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsTileMenuOpen(false);
          onMapReset(map.id);
        }}
        bg="overlay"
        sx={{ borderRadius: "50%" }}
        m={1}
      >
        <ResetMapIcon />
      </IconButton>
    );
  }

  return (
    <Flex
      key={map.id}
      sx={{
        borderColor: "primary",
        borderStyle: isSelected ? "solid" : "none",
        borderWidth: "4px",
        position: "relative",
        width: "150px",
        height: "150px",
        borderRadius: "4px",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
      }}
      m={2}
      bg="muted"
      onClick={() => {
        setIsTileMenuOpen(false);
        if (!isSelected) {
          onMapSelect(map);
        }
      }}
      onDoubleClick={(e) => {
        if (!isMapTileMenuOpen) {
          onSubmit(e);
        }
      }}
    >
      <UIImage
        sx={{ width: "100%", height: "100%", objectFit: "contain" }}
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
        <Text as="p" variant="heading" color="hsl(210, 50%, 96%)">
          {map.name}
        </Text>
      </Flex>
      {/* Show expand button only if both reset and remove is available */}
      {isSelected && (
        <Box sx={{ position: "absolute", top: 0, right: 0 }}>
          {isDefault && hasMapState && resetButton(map)}
          {!isDefault && hasMapState && !isMapTileMenuOpen && expandButton}
          {!isDefault && !hasMapState && removeButton(map)}
        </Box>
      )}
      {/* Tile menu for two actions */}
      {!isDefault && isMapTileMenuOpen && isSelected && (
        <Flex
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
          bg="muted"
          onClick={() => setIsTileMenuOpen(false)}
        >
          {!isDefault && removeButton(map)}
          {hasMapState && resetButton(map)}
        </Flex>
      )}
    </Flex>
  );
}

export default MapTile;
