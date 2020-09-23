import React from "react";
import { Flex, Box, Label, Input, Checkbox, IconButton } from "theme-ui";

import ExpandMoreIcon from "../../icons/ExpandMoreIcon";

import { isEmpty } from "../../helpers/shared";

import Divider from "../Divider";
import Select from "../Select";

const qualitySettings = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "ultra", label: "Ultra High" },
  { value: "original", label: "Original" },
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
            value={`${(map && map.gridX) || 0}`}
            onChange={(e) =>
              onSettingsChange("gridX", parseInt(e.target.value))
            }
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
            value={`${(map && map.gridY) || 0}`}
            onChange={(e) =>
              onSettingsChange("gridY", parseInt(e.target.value))
            }
            disabled={mapEmpty || map.type === "default"}
            min={1}
            my={1}
          />
        </Box>
      </Flex>
      {showMore && (
        <>
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
          <Flex
            mt={2}
            mb={mapEmpty || map.type === "default" ? 2 : 0}
            sx={{ alignItems: "flex-end" }}
          >
            <Box mb={1} sx={{ width: "50%" }}>
              <Label mb={1}>Grid Type</Label>
              <Select
                defaultValue={{ value: "square", label: "Square" }}
                isDisabled={mapEmpty || map.type === "default"}
                options={[
                  { value: "square", label: "Square" },
                  { value: "hex", label: "Hex (Coming Soon)" },
                ]}
                isOptionDisabled={(option) => option.value === "hex"}
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
                Show Grid
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
