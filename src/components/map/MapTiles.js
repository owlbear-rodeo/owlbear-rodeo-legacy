import React, { useEffect, useState } from "react";
import { Flex, Box, Text, IconButton, Close, Grid } from "theme-ui";
import SimpleBar from "simplebar-react";

import RemoveMapIcon from "../../icons/RemoveMapIcon";
import ResetMapIcon from "../../icons/ResetMapIcon";

import MapTile from "./MapTile";
import MapTileGroup from "./MapTileGroup";
import Link from "../Link";
import FilterBar from "../FilterBar";

import SortableTiles from "../drag/SortableTiles";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

import {
  groupsFromIds,
  itemsFromGroups,
  getGroupItems,
} from "../../helpers/select";

function MapTiles({
  maps,
  mapStates,
  groups,
  selectedGroupIds,
  onTileSelect,
  onMapsRemove,
  onMapsReset,
  onMapAdd,
  onMapEdit,
  onDone,
  selectMode,
  onSelectModeChange,
  search,
  onSearchChange,
  onMapsGroup,
  databaseDisabled,
}) {
  const layout = useResponsiveLayout();

  const [hasMapState, setHasMapState] = useState(false);
  const [hasSelectedDefaultMap, setHasSelectedDefaultMap] = useState(false);

  useEffect(() => {
    const selectedGroups = groupsFromIds(selectedGroupIds, groups);
    const selectedMaps = itemsFromGroups(selectedGroups, maps);
    const selectedMapStates = itemsFromGroups(
      selectedGroups,
      mapStates,
      "mapId"
    );

    setHasSelectedDefaultMap(
      selectedMaps.some((map) => map.type === "default")
    );

    let _hasMapState = false;
    for (let state of selectedMapStates) {
      if (
        Object.values(state.tokens).length > 0 ||
        Object.values(state.drawShapes).length > 0 ||
        Object.values(state.fogShapes).length > 0 ||
        Object.values(state.notes).length > 0
      ) {
        _hasMapState = true;
        break;
      }
    }

    setHasMapState(_hasMapState);
  }, [selectedGroupIds, maps, mapStates, groups]);

  function renderTile(group) {
    if (group.type === "item") {
      const map = maps.find((map) => map.id === group.id);
      const isSelected = selectedGroupIds.includes(group.id);
      return (
        <MapTile
          key={map.id}
          map={map}
          isSelected={isSelected}
          onSelect={onTileSelect}
          onEdit={onMapEdit}
          onDone={onDone}
          canEdit={
            isSelected &&
            selectMode === "single" &&
            selectedGroupIds.length === 1
          }
          badges={[`${map.grid.size.x}x${map.grid.size.y}`]}
        />
      );
    } else {
      const isSelected = selectedGroupIds.includes(group.id);
      const items = getGroupItems(group);
      return (
        <MapTileGroup
          key={group.id}
          group={group}
          maps={items.map((item) => maps.find((map) => map.id === item.id))}
          isSelected={isSelected}
          onSelect={onTileSelect}
        />
      );
    }
  }

  const multipleSelected = selectedGroupIds.length > 1;

  function renderTiles(tiles) {
    return (
      <Box sx={{ position: "relative" }}>
        <FilterBar
          onFocus={() => onTileSelect()}
          search={search}
          onSearchChange={onSearchChange}
          selectMode={selectMode}
          onSelectModeChange={onSelectModeChange}
          onAdd={onMapAdd}
          addTitle="Add Map"
        />
        <SimpleBar
          style={{
            height: layout.screenSize === "large" ? "600px" : "400px",
          }}
        >
          <Grid
            p={2}
            pb={4}
            pt={databaseDisabled ? 4 : 2}
            bg="muted"
            sx={{
              borderRadius: "4px",
              minHeight: layout.screenSize === "large" ? "600px" : "400px",
              overflow: "hidden",
            }}
            gap={2}
            columns={layout.gridTemplate}
            onClick={() => onTileSelect()}
          >
            {tiles}
          </Grid>
        </SimpleBar>
        {databaseDisabled && (
          <Box
            sx={{
              position: "absolute",
              top: "39px",
              left: 0,
              right: 0,
              textAlign: "center",
              borderRadius: "2px",
            }}
            bg="highlight"
            p={1}
          >
            <Text as="p" variant="body2">
              Map saving is unavailable. See <Link to="/faq#saving">FAQ</Link>{" "}
              for more information.
            </Text>
          </Box>
        )}
        {selectedGroupIds.length > 0 && (
          <Flex
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              justifyContent: "space-between",
            }}
            bg="overlay"
          >
            <Close
              title="Clear Selection"
              aria-label="Clear Selection"
              onClick={() => onTileSelect()}
            />
            <Flex>
              <IconButton
                aria-label={multipleSelected ? "Reset Maps" : "Reset Map"}
                title={multipleSelected ? "Reset Maps" : "Reset Map"}
                onClick={() => onMapsReset()}
                disabled={!hasMapState}
              >
                <ResetMapIcon />
              </IconButton>
              <IconButton
                aria-label={multipleSelected ? "Remove Maps" : "Remove Map"}
                title={multipleSelected ? "Remove Maps" : "Remove Map"}
                onClick={() => onMapsRemove()}
                disabled={hasSelectedDefaultMap}
              >
                <RemoveMapIcon />
              </IconButton>
            </Flex>
          </Flex>
        )}
      </Box>
    );
  }

  return (
    <SortableTiles
      groups={groups}
      onGroupChange={onMapsGroup}
      renderTile={renderTile}
      renderTiles={renderTiles}
      onTileSelect={onTileSelect}
    />
  );
}

export default MapTiles;
