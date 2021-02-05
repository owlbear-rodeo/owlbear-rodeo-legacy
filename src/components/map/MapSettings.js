import React from "react";
import { Flex, Box, Label, Input, Checkbox, IconButton } from "theme-ui";

import ExpandMoreIcon from "../../icons/ExpandMoreIcon";

import { isEmpty } from "../../helpers/shared";
import { getGridUpdatedInset } from "../../helpers/grid";

import Divider from "../Divider";
import Select from "../Select";

const qualitySettings = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "ultra", label: "Ultra High" },
  { value: "original", label: "Original" },
];

const gridTypeSettings = [
  { value: "square", label: "Square" },
  { value: "hexVertical", label: "Hex Vertical" },
  { value: "hexHorizontal", label: "Hex Horizontal" },
];

function MapSettings({
  map,
  mapState,
  onSettingsChange,
  onStateSettingsChange,
  showMore,
  onShowMoreChange,
}) {
  function handleFlagChange(event, flag) {
    if (event.target.checked) {
      onStateSettingsChange("editFlags", [...mapState.editFlags, flag]);
    } else {
      onStateSettingsChange(
        "editFlags",
        mapState.editFlags.filter((f) => f !== flag)
      );
    }
  }

  function handleGridSizeXChange(event) {
    const value = parseInt(event.target.value) || 0;
    let grid = {
      ...map.grid,
      size: {
        ...map.grid.size,
        x: value,
      },
    };
    grid.inset = getGridUpdatedInset(grid, map.width, map.height);
    onSettingsChange("grid", grid);
  }

  function handleGridSizeYChange(event) {
    const value = parseInt(event.target.value) || 0;
    let grid = {
      ...map.grid,
      size: {
        ...map.grid.size,
        y: value,
      },
    };
    grid.inset = getGridUpdatedInset(grid, map.width, map.height);
    onSettingsChange("grid", grid);
  }

  function handleGridTypeChange(option) {
    let grid = { ...map.grid, type: option.value };
    grid.inset = getGridUpdatedInset(grid, map.width, map.height);
    onSettingsChange("grid", grid);
  }

  function getMapSize() {
    let size = 0;
    if (map.quality === "original") {
      size = map.file.length;
    } else {
      size = map.resolutions[map.quality].file.length;
    }
    size /= 1000000; // Bytes to Megabytes
    return `${size.toFixed(2)}MB`;
  }

  const mapEmpty = !map || isEmpty(map);
  const mapStateEmpty = !mapState || isEmpty(mapState);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex>
        <Box mt={2} mr={1} sx={{ flexGrow: 1 }}>
          <Label htmlFor="gridX">Columns</Label>
          <Input
            type="number"
            name="gridX"
            value={`${(map && map.grid.size.x) || 0}`}
            onChange={handleGridSizeXChange}
            disabled={mapEmpty || map.type === "default"}
            min={1}
            my={1}
          />
        </Box>
        <Box mt={2} ml={1} sx={{ flexGrow: 1 }}>
          <Label htmlFor="gridY">Rows</Label>
          <Input
            type="number"
            name="gridY"
            value={`${(map && map.grid.size.y) || 0}`}
            onChange={handleGridSizeYChange}
            disabled={mapEmpty || map.type === "default"}
            min={1}
            my={1}
          />
        </Box>
      </Flex>
      <Box mt={2} sx={{ flexGrow: 1 }}>
        <Label htmlFor="name">Name</Label>
        <Input
          name="name"
          value={(map && map.name) || ""}
          onChange={(e) => onSettingsChange("name", e.target.value)}
          disabled={mapEmpty || map.type === "default"}
          my={1}
        />
      </Box>
      {showMore && (
        <>
          <Flex
            mt={2}
            mb={mapEmpty || map.type === "default" ? 2 : 0}
            sx={{ alignItems: "flex-end" }}
          >
            <Box mb={1} sx={{ width: "50%" }}>
              <Label mb={1}>Grid Type</Label>
              <Select
                isDisabled={mapEmpty || map.type === "default"}
                options={gridTypeSettings}
                value={
                  !mapEmpty &&
                  gridTypeSettings.find((s) => s.value === map.grid.type)
                }
                onChange={handleGridTypeChange}
                isSearchable={false}
              />
            </Box>
            <Flex sx={{ width: "50%", flexDirection: "column" }} ml={2}>
              <Label>
                <Checkbox
                  checked={!mapEmpty && map.showGrid}
                  disabled={mapEmpty || map.type === "default"}
                  onChange={(e) =>
                    onSettingsChange("showGrid", e.target.checked)
                  }
                />
                Draw Grid
              </Label>
              <Label>
                <Checkbox
                  checked={!mapEmpty && map.snapToGrid}
                  disabled={mapEmpty || map.type === "default"}
                  onChange={(e) =>
                    onSettingsChange("snapToGrid", e.target.checked)
                  }
                />
                Snap to Grid
              </Label>
            </Flex>
          </Flex>
          {!mapEmpty && map.type !== "default" && (
            <Flex my={2} sx={{ alignItems: "center" }}>
              <Box mb={1} sx={{ width: "50%" }}>
                <Label mb={1}>Quality</Label>
                <Select
                  options={qualitySettings}
                  value={
                    !mapEmpty &&
                    qualitySettings.find((s) => s.value === map.quality)
                  }
                  isDisabled={mapEmpty}
                  onChange={(option) =>
                    onSettingsChange("quality", option.value)
                  }
                  isOptionDisabled={(option) =>
                    mapEmpty ||
                    (option.value !== "original" &&
                      !map.resolutions[option.value])
                  }
                  isSearchable={false}
                />
              </Box>
              <Label sx={{ width: "50%" }} ml={2}>
                Size: {getMapSize()}
              </Label>
            </Flex>
          )}
          <Divider fill />
          <Box my={2} sx={{ flexGrow: 1 }}>
            <Label>Allow Others to Edit</Label>
            <Flex my={1}>
              <Label>
                <Checkbox
                  checked={!mapStateEmpty && mapState.editFlags.includes("fog")}
                  disabled={mapStateEmpty}
                  onChange={(e) => handleFlagChange(e, "fog")}
                />
                Fog
              </Label>
              <Label>
                <Checkbox
                  checked={
                    !mapStateEmpty && mapState.editFlags.includes("drawing")
                  }
                  disabled={mapStateEmpty}
                  onChange={(e) => handleFlagChange(e, "drawing")}
                />
                Drawings
              </Label>
              <Label>
                <Checkbox
                  checked={
                    !mapStateEmpty && mapState.editFlags.includes("tokens")
                  }
                  disabled={mapStateEmpty}
                  onChange={(e) => handleFlagChange(e, "tokens")}
                />
                Tokens
              </Label>
              <Label>
                <Checkbox
                  checked={
                    !mapStateEmpty && mapState.editFlags.includes("notes")
                  }
                  disabled={mapStateEmpty}
                  onChange={(e) => handleFlagChange(e, "notes")}
                />
                Notes
              </Label>
            </Flex>
          </Box>
        </>
      )}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onShowMoreChange(!showMore);
        }}
        sx={{
          transform: `rotate(${showMore ? "180deg" : "0"})`,
          alignSelf: "center",
        }}
        aria-label={showMore ? "Show Less" : "Show More"}
        title={showMore ? "Show Less" : "Show More"}
      >
        <ExpandMoreIcon />
      </IconButton>
    </Flex>
  );
}

export default MapSettings;
