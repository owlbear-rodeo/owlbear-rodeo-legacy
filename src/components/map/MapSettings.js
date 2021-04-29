import React, { useEffect, useState } from "react";
import { Flex, Box, Label, Input, Checkbox, IconButton } from "theme-ui";

import ExpandMoreIcon from "../../icons/ExpandMoreIcon";

import { isEmpty } from "../../helpers/shared";
import { getGridUpdatedInset } from "../../helpers/grid";

import { useDataURL } from "../../contexts/AssetsContext";
import { mapSources as defaultMapSources } from "../../maps";

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

const gridSquareMeasurementTypeSettings = [
  { value: "chebyshev", label: "Chessboard (D&D 5e)" },
  { value: "alternating", label: "Alternating Diagonal (D&D 3.5e)" },
  { value: "euclidean", label: "Euclidean" },
  { value: "manhattan", label: "Manhattan" },
];

const gridHexMeasurementTypeSettings = [
  { value: "manhattan", label: "Manhattan" },
  { value: "euclidean", label: "Euclidean" },
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
    const type = option.value;
    let grid = {
      ...map.grid,
      type,
      measurement: {
        ...map.grid.measurement,
        type: type === "square" ? "chebyshev" : "manhattan",
      },
    };
    grid.inset = getGridUpdatedInset(grid, map.width, map.height);
    onSettingsChange("grid", grid);
  }

  function handleGridMeasurementTypeChange(option) {
    const grid = {
      ...map.grid,
      measurement: {
        ...map.grid.measurement,
        type: option.value,
      },
    };
    onSettingsChange("grid", grid);
  }

  function handleGridMeasurementScaleChange(event) {
    const grid = {
      ...map.grid,
      measurement: {
        ...map.grid.measurement,
        scale: event.target.value,
      },
    };
    onSettingsChange("grid", grid);
  }

  const mapURL = useDataURL(map, defaultMapSources);
  const [mapSize, setMapSize] = useState(0);
  useEffect(() => {
    async function updateMapSize() {
      if (mapURL) {
        const response = await fetch(mapURL);
        const blob = await response.blob();
        let size = blob.size;
        size /= 1000000; // Bytes to Megabytes
        setMapSize(size.toFixed(2));
      } else {
        setMapSize(0);
      }
    }
    updateMapSize();
  }, [mapURL]);

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
            sx={{ flexDirection: "column" }}
          >
            <Flex sx={{ alignItems: "flex-end" }}>
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
            <Flex sx={{ alignItems: "flex-end" }}>
              <Box my={2} sx={{ width: "50%" }}>
                <Label mb={1}>Grid Measurement</Label>
                <Select
                  isDisabled={mapEmpty || map.type === "default"}
                  options={
                    map && map.grid.type === "square"
                      ? gridSquareMeasurementTypeSettings
                      : gridHexMeasurementTypeSettings
                  }
                  value={
                    !mapEmpty &&
                    gridSquareMeasurementTypeSettings.find(
                      (s) => s.value === map.grid.measurement.type
                    )
                  }
                  onChange={handleGridMeasurementTypeChange}
                  isSearchable={false}
                />
              </Box>
              <Box mb={1} mx={2} sx={{ flexGrow: 1 }}>
                <Label htmlFor="gridMeasurementScale">Grid Scale</Label>
                <Input
                  name="gridMeasurementScale"
                  value={`${map && map.grid.measurement.scale}`}
                  onChange={handleGridMeasurementScaleChange}
                  disabled={mapEmpty || map.type === "default"}
                  min={1}
                  my={1}
                  autoComplete="off"
                />
              </Box>
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
                Size: {mapSize > 0 && `${mapSize}MB`}
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
