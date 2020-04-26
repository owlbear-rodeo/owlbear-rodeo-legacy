import React from "react";
import { Flex, Box, Label, Input } from "theme-ui";

function MapSettings({ map, onSettingsChange }) {
  return (
    <Flex>
      <Box mb={2} mr={1} sx={{ flexGrow: 1 }}>
        <Label htmlFor="gridX">Columns</Label>
        <Input
          type="number"
          name="gridX"
          value={(map && map.gridX) || 0}
          onChange={(e) => onSettingsChange("gridX", parseInt(e.target.value))}
          disabled={map === null || map.type === "default"}
          min={1}
        />
      </Box>
      <Box mb={2} ml={1} sx={{ flexGrow: 1 }}>
        <Label htmlFor="gridY">Rows</Label>
        <Input
          type="number"
          name="gridY"
          value={(map && map.gridY) || 0}
          onChange={(e) => onSettingsChange("gridY", parseInt(e.target.value))}
          disabled={map === null || map.type === "default"}
          min={1}
        />
      </Box>
    </Flex>
  );
}

export default MapSettings;
