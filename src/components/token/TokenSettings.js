import React from "react";
import { Flex, Box, Input, IconButton, Label, Checkbox } from "theme-ui";

import ExpandMoreIcon from "../../icons/ExpandMoreIcon";
import { isEmpty } from "../../helpers/shared";

import Select from "../Select";

const categorySettings = [
  { value: "character", label: "Character" },
  { value: "prop", label: "Prop" },
  { value: "vehicle", label: "Vehicle / Mount" },
];

function TokenSettings({
  token,
  onSettingsChange,
  showMore,
  onShowMoreChange,
}) {
  const tokenEmpty = !token || isEmpty(token);
  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex>
        <Box mt={2} sx={{ flexGrow: 1 }}>
          <Label htmlFor="tokenSize">Default Size</Label>
          <Input
            type="number"
            name="tokenSize"
            value={`${(token && token.defaultSize) || 0}`}
            onChange={(e) =>
              onSettingsChange("defaultSize", parseInt(e.target.value))
            }
            disabled={tokenEmpty || token.type === "default"}
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
              value={(token && token.name) || ""}
              onChange={(e) => onSettingsChange("name", e.target.value)}
              disabled={tokenEmpty || token.type === "default"}
              my={1}
            />
          </Box>
          <Flex my={2}>
            <Box mb={1} sx={{ flexGrow: 1 }}>
              <Label mb={1}>Category</Label>
              <Select
                options={categorySettings}
                value={
                  !tokenEmpty &&
                  categorySettings.find((s) => s.value === token.category)
                }
                isDisabled={tokenEmpty || token.type === "default"}
                onChange={(option) =>
                  onSettingsChange("category", option.value)
                }
              />
            </Box>
            <Flex sx={{ flexGrow: 1, alignItems: "center" }} ml={2}>
              <Label>
                <Checkbox
                  checked={token && token.hideInSidebar}
                  disabled={tokenEmpty || token.type === "default"}
                  onChange={(e) =>
                    onSettingsChange("hideInSidebar", e.target.checked)
                  }
                />
                Hide in Sidebar
              </Label>
            </Flex>
          </Flex>
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

export default TokenSettings;
