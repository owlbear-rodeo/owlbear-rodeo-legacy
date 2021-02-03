import React, { useContext } from "react";
import { Flex, Box, Text, IconButton, Close, Label } from "theme-ui";
import SimpleBar from "simplebar-react";
import Case from "case";

import RemoveMapIcon from "../../icons/RemoveMapIcon";
import ResetMapIcon from "../../icons/ResetMapIcon";
import GroupIcon from "../../icons/GroupIcon";

import MapTile from "./MapTile";
import Link from "../Link";
import FilterBar from "../FilterBar";

import DatabaseContext from "../../contexts/DatabaseContext";

import useResponsiveLayout from "../../helpers/useResponsiveLayout";

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
  const { databaseStatus } = useContext(DatabaseContext);
  const layout = useResponsiveLayout();

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

  return (
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
        style={{ height: layout.screenSize === "large" ? "600px" : "400px" }}
      >
        <Flex
          p={2}
          pb={4}
          pt={databaseStatus === "disabled" ? 4 : 2}
          bg="muted"
          sx={{
            flexWrap: "wrap",
            borderRadius: "4px",
            minHeight: layout.screenSize === "large" ? "600px" : "400px",
            alignContent: "flex-start",
          }}
          onClick={() => onMapSelect()}
        >
          {groups.map((group) => (
            <React.Fragment key={group}>
              <Label mx={1} mt={2}>
                {Case.capital(group)}
              </Label>
              {maps[group].map(mapToTile)}
            </React.Fragment>
          ))}
        </Flex>
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
            Map saving is unavailable. See <Link to="/faq#saving">FAQ</Link> for
            more information.
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
              aria-label={multipleSelected ? "Group Maps" : "Group Map"}
              title={multipleSelected ? "Group Maps" : "Group Map"}
              onClick={() => onMapsGroup()}
              disabled={hasSelectedDefaultMap}
            >
              <GroupIcon />
            </IconButton>
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

export default MapTiles;
