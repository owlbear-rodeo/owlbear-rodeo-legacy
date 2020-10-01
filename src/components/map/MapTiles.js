import React, { useContext } from "react";
import { Flex, Box, Text, IconButton, Close, Label } from "theme-ui";
import SimpleBar from "simplebar-react";
import { useMedia } from "react-media";
import Case from "case";

import AddIcon from "../../icons/AddIcon";
import RemoveMapIcon from "../../icons/RemoveMapIcon";
import ResetMapIcon from "../../icons/ResetMapIcon";
import SelectMultipleIcon from "../../icons/SelectMultipleIcon";
import SelectSingleIcon from "../../icons/SelectSingleIcon";
import GroupIcon from "../../icons/GroupIcon";

import RadioIconButton from "./controls/RadioIconButton";

import MapTile from "./MapTile";
import Link from "../Link";
import Search from "../Search";

import DatabaseContext from "../../contexts/DatabaseContext";

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
  const isSmallScreen = useMedia({ query: "(max-width: 500px)" });

  let hasMapState = false;
  for (let state of selectedMapStates) {
    if (
      Object.values(state.tokens).length > 0 ||
      state.mapDrawActions.length > 0 ||
      state.fogDrawActions.length > 0
    ) {
      hasMapState = true;
      break;
    }
  }

  let hasSelectedDefaultMap = false;
  for (let map of selectedMaps) {
    if (map.type === "default") {
      hasSelectedDefaultMap = true;
      break;
    }
  }

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
        large={isSmallScreen}
        canEdit={
          isSelected && selectMode === "single" && selectedMaps.length === 1
        }
        badges={[`${map.gridX}x${map.gridY}`]}
      />
    );
  }

  const multipleSelected = selectedMaps.length > 1;

  return (
    <Box sx={{ position: "relative" }}>
      <Flex
        bg="muted"
        sx={{
          border: "1px solid",
          borderColor: "text",
          borderRadius: "4px",
          alignItems: "center",
          ":focus-within": {
            outline: "1px auto",
            outlineColor: "primary",
            outlineOffset: "0px",
          },
        }}
        onFocus={() => onMapSelect()}
      >
        <Search value={search} onChange={onSearchChange} />
        <Flex
          mr={1}
          px={1}
          sx={{
            borderRight: "1px solid",
            borderColor: "text",
            height: "36px",
            alignItems: "center",
          }}
        >
          <RadioIconButton
            title="Select Single"
            onClick={() => onSelectModeChange("single")}
            isSelected={selectMode === "single"}
          >
            <SelectSingleIcon />
          </RadioIconButton>
          <RadioIconButton
            title="Select Multiple"
            onClick={() => onSelectModeChange("multiple")}
            isSelected={selectMode === "multiple" || selectMode === "range"}
          >
            <SelectMultipleIcon />
          </RadioIconButton>
        </Flex>
        <IconButton
          onClick={onMapAdd}
          aria-label="Add Map"
          title="Add Map"
          mr={1}
        >
          <AddIcon />
        </IconButton>
      </Flex>
      <SimpleBar style={{ height: "400px" }}>
        <Flex
          p={2}
          pb={4}
          bg="muted"
          sx={{
            flexWrap: "wrap",
            borderRadius: "4px",
            minHeight: "400px",
            alignContent: "flex-start",
          }}
          onClick={() => onMapSelect()}
        >
          {/* Render ungrouped maps, grouped maps then default maps */}
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
            top: 0,
            left: 0,
            right: 0,
            textAlign: "center",
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
