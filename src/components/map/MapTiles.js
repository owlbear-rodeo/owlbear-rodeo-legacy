import React, { useContext } from "react";
import { Flex, Box, Text } from "theme-ui";
import SimpleBar from "simplebar-react";

import AddIcon from "../../icons/AddIcon";

import MapTile from "./MapTile";
import Link from "../Link";

import DatabaseContext from "../../contexts/DatabaseContext";

function MapTiles({
  maps,
  selectedMap,
  selectedMapState,
  onMapSelect,
  onMapAdd,
  onMapRemove,
  onMapReset,
  onSubmit,
}) {
  const { databaseStatus } = useContext(DatabaseContext);
  return (
    <Box sx={{ position: "relative" }}>
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
              mapState={
                selectedMap && map.id === selectedMap.id && selectedMapState
              }
              isSelected={selectedMap && map.id === selectedMap.id}
              onMapSelect={onMapSelect}
              onMapRemove={onMapRemove}
              onMapReset={onMapReset}
              onSubmit={onSubmit}
            />
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
            Map saving is unavailable. See <Link to="/faq">FAQ</Link> for more
            information.
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default MapTiles;
