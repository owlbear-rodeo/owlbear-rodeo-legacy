import React from "react";
import { Flex, Box, Input, IconButton, Label } from "theme-ui";

import ExpandMoreIcon from "../../icons/ExpandMoreIcon";

function TokenSettings({
  token,
  onSettingsChange,
  showMore,
  onShowMoreChange,
}) {
  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex>
        <Box mt={2} sx={{ flexGrow: 1 }}>
          <Label htmlFor="tokenSize">Default Size</Label>
          <Input
            type="number"
            name="tokenSize"
            value={(token && token.defaultSize) || 1}
            onChange={(e) =>
              onSettingsChange("defaultSize", parseInt(e.target.value))
            }
            disabled={!token || token.type === "default"}
            min={1}
            my={1}
          />
        </Box>
      </Flex>
      {showMore && (
        <>
          <Box my={2} sx={{ flexGrow: 1 }}>
            <Label htmlFor="name">Name</Label>
            <Input
              name="name"
              value={(token && token.name) || ""}
              onChange={(e) => onSettingsChange("name", e.target.value)}
              disabled={!token || token.type === "default"}
              my={1}
            />
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
        disabled={!token}
      >
        <ExpandMoreIcon />
      </IconButton>
    </Flex>
  );
}

export default TokenSettings;
