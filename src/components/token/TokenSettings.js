import React from "react";
import { Flex, Box, Input, Label } from "theme-ui";

import { isEmpty } from "../../helpers/shared";

import Select from "../Select";

const categorySettings = [
  { value: "character", label: "Character" },
  { value: "prop", label: "Prop" },
  { value: "vehicle", label: "Vehicle / Mount" },
];

function TokenSettings({ token, onSettingsChange }) {
  const tokenEmpty = !token || isEmpty(token);
  return (
    <Flex sx={{ flexDirection: "column" }}>
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
      <Box mt={2}>
        <Label mb={1}>Default Category</Label>
        <Select
          options={categorySettings}
          value={
            !tokenEmpty &&
            categorySettings.find((s) => s.value === token.defaultCategory)
          }
          isDisabled={tokenEmpty || token.type === "default"}
          onChange={(option) =>
            onSettingsChange("defaultCategory", option.value)
          }
          isSearchable={false}
        />
      </Box>
      <Flex>
        <Box my={2} sx={{ flexGrow: 1 }}>
          <Label htmlFor="tokenSize">Default Size</Label>
          <Input
            type="number"
            name="tokenSize"
            value={`${(token && token.defaultSize) || 0}`}
            onChange={(e) =>
              onSettingsChange("defaultSize", parseFloat(e.target.value))
            }
            disabled={tokenEmpty || token.type === "default"}
            min={1}
            my={1}
          />
        </Box>
      </Flex>
    </Flex>
  );
}

export default TokenSettings;
