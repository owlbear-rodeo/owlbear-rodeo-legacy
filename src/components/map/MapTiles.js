import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Flex, Box, Text, IconButton, Close, Grid } from "theme-ui";
import SimpleBar from "simplebar-react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";

import RemoveMapIcon from "../../icons/RemoveMapIcon";
import ResetMapIcon from "../../icons/ResetMapIcon";

import MapTile from "./MapTile";
import Link from "../Link";
import FilterBar from "../FilterBar";
import Sortable from "../Sortable";

import { useDatabase } from "../../contexts/DatabaseContext";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

function MapTiles({
  maps,
  groups,
  selectedMaps,
  selectedMapStates,
  onMapSelect,
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
}) {
  const { databaseStatus } = useDatabase();
  const layout = useResponsiveLayout();
  const [dragId, setDragId] = useState();

  let hasMapState = false;
  for (let state of selectedMapStates) {
    if (
      Object.values(state.tokens).length > 0 ||
      Object.values(state.drawShapes).length > 0 ||
      Object.values(state.fogShapes).length > 0 ||
      Object.values(state.notes).length > 0
    ) {
      hasMapState = true;
      break;
    }
  }

  let hasSelectedDefaultMap = selectedMaps.some(
    (map) => map.type === "default"
  );

  function mapToTile(map) {
    const isSelected = selectedMaps.includes(map);
    return (
      <MapTile
        key={map.id}
        map={map}
        isSelected={isSelected}
        onMapSelect={onMapSelect}
        onMapEdit={onMapEdit}
        onDone={onDone}
        size={layout.tileSize}
        canEdit={
          isSelected && selectMode === "single" && selectedMaps.length === 1
        }
        badges={[`${map.grid.size.x}x${map.grid.size.y}`]}
      />
    );
  }

  const multipleSelected = selectedMaps.length > 1;

  function handleDragStart({ active }) {
    setDragId(active.id);
  }

  function handleDragEnd({ active, over }) {
    setDragId();
    if (active && over && active.id !== over.id) {
      const oldIndex = groups.indexOf(active.id);
      const newIndex = groups.indexOf(over.id);
      onMapsGroup(arrayMove(groups, oldIndex, newIndex));
    }
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={groups}>
        <Box sx={{ position: "relative" }}>
          <FilterBar
            onFocus={() => onMapSelect()}
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
              pt={databaseStatus === "disabled" ? 4 : 2}
              bg="muted"
              sx={{
                borderRadius: "4px",
                minHeight: layout.screenSize === "large" ? "600px" : "400px",
                overflow: "hidden",
              }}
              gap={2}
              columns={layout.gridTemplate}
              onClick={() => onMapSelect()}
            >
              {groups.map((mapId) => (
                <Sortable id={mapId} key={mapId}>
                  {mapToTile(maps.find((map) => map.id === mapId))}
                </Sortable>
              ))}
            </Grid>
          </SimpleBar>
          {databaseStatus === "disabled" && (
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
          {selectedMaps.length > 0 && (
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
                onClick={() => onMapSelect()}
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
        {createPortal(
          <DragOverlay>
            {dragId && mapToTile(maps.find((maps) => maps.id === dragId))}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  );
}

export default MapTiles;
