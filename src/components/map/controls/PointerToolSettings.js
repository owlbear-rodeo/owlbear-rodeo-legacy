import React from "react";
import { Flex } from "theme-ui";

import ColorControl from "./ColorControl";

function PointerToolSettings({ settings, onSettingChange }) {
  return (
    <Flex sx={{ alignItems: "center" }}>
      <ColorControl
        color={settings.color}
        onColorChange={(color) => onSettingChange({ color })}
        exclude={["black", "darkGray", "lightGray", "white"]}
      />
    </Flex>
  );
}

export default PointerToolSettings;
