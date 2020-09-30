import React, { useContext } from "react";
import { Flex, Box, Text, IconButton, Close } from "theme-ui";
import SimpleBar from "simplebar-react";
import { useMedia } from "react-media";

import AddIcon from "../../icons/AddIcon";
import RemoveMapIcon from "../../icons/RemoveMapIcon";
import ResetMapIcon from "../../icons/ResetMapIcon";
import SelectMultipleIcon from "../../icons/SelectMultipleIcon";
import SelectSingleIcon from "../../icons/SelectSingleIcon";

import MapTile from "./MapTile";
import Link from "../Link";
import Search from "../Search";

import DatabaseContext from "../../contexts/DatabaseContext";

function MapTiles({
  maps,
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
}) {
  const { databaseStatus } = useContext(DatabaseContext);
  const isSmallScreen = useMedia({ query: "(max-width: 500px)" });

  let hasMapState = false;
  if (selectedMapStates.length > 0) {
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
  }

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
        <Search />
        <IconButton
          onClick={() =>
            onSelectModeChange(selectMode === "single" ? "multiple" : "single")
          }
          aria-label={
            selectMode === "single" ? "Select Multiple" : "Select Single"
          }
          title={selectMode === "single" ? "Select Multiple" : "Select Single"}
          ml={1}
        >
          {selectMode === "single" ? (
            <SelectMultipleIcon />
          ) : (
            <SelectSingleIcon />
          )}
        </IconButton>
        <IconButton
          onClick={onMapAdd}
          aria-label="Add Map"
          title="Add Map"
          mr={1}
        >
          <AddIcon />
        </IconButton>
      </Flex>
      <SimpleBar style={{ maxHeight: "400px" }}>
        <Flex
          p={2}
          pb={4}
          bg="muted"
          sx={{
            flexWrap: "wrap",
            borderRadius: "4px",
          }}
          onClick={() => onMapSelect()}
        >
          {maps.map((map) => {
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
                canEdit={isSelected && selectMode === "single"}
              />
            );
          })}
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
              aria-label="Reset Map"
              title="Reset Map"
              onClick={() => onMapsReset()}
              disabled={!hasMapState}
            >
              <ResetMapIcon />
            </IconButton>
            <IconButton
              aria-label="Remove Map"
              title="Remove Map"
              onClick={() => onMapsRemove()}
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
