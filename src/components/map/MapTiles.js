import React, { useContext } from "react";
import { Flex, Box, Text, IconButton, Close } from "theme-ui";
import SimpleBar from "simplebar-react";
import { useMedia } from "react-media";

import AddIcon from "../../icons/AddIcon";
import RemoveMapIcon from "../../icons/RemoveMapIcon";
import ResetMapIcon from "../../icons/ResetMapIcon";

import MapTile from "./MapTile";
import Link from "../Link";

import DatabaseContext from "../../contexts/DatabaseContext";

function MapTiles({
  maps,
  selectedMap,
  selectedMapState,
  onMapSelect,
  onMapRemove,
  onMapReset,
  onMapAdd,
  onMapEdit,
  onDone,
}) {
  const { databaseStatus } = useContext(DatabaseContext);
  const isSmallScreen = useMedia({ query: "(max-width: 500px)" });

  const hasMapState =
    selectedMapState &&
    (Object.values(selectedMapState.tokens).length > 0 ||
      selectedMapState.mapDrawActions.length > 0 ||
      selectedMapState.fogDrawActions.length > 0);

  return (
    <Box sx={{ position: "relative" }}>
      <SimpleBar style={{ maxHeight: "400px" }}>
        <Flex
          p={2}
          pb={4}
          bg="muted"
          sx={{
            flexWrap: "wrap",
            borderRadius: "4px",
          }}
          onClick={() => onMapSelect(null)}
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
              width: isSmallScreen ? "48%" : "32%",
              height: "0",
              paddingTop: isSmallScreen ? "48%" : "32%",
              borderRadius: "4px",
              position: "relative",
              cursor: "pointer",
            }}
            my={1}
            mx={`${isSmallScreen ? 1 : 2 / 3}%`}
            bg="muted"
            aria-label="Add Map"
            title="Add Map"
          >
            <Flex
              sx={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AddIcon large />
            </Flex>
          </Flex>
          {maps.map((map) => {
            const isSelected = selectedMap && map.id === selectedMap.id;
            return (
              <MapTile
                key={map.id}
                map={map}
                isSelected={isSelected}
                onMapSelect={onMapSelect}
                onMapEdit={onMapEdit}
                onDone={onDone}
                large={isSmallScreen}
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
      {selectedMap && (
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
            onClick={() => onMapSelect(null)}
          />
          <Flex>
            <IconButton
              aria-label="Reset Map"
              title="Reset Map"
              onClick={() => onMapReset(selectedMap.id)}
              disabled={!hasMapState}
            >
              <ResetMapIcon />
            </IconButton>
            <IconButton
              aria-label="Remove Map"
              title="Remove Map"
              onClick={() => onMapRemove(selectedMap.id)}
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
