import { Flex } from "theme-ui";

import ColorControl from "./ColorControl";

import { PointerToolSettings } from "../../../types/Pointer";

type PointerToolSettingsProps = {
  settings: PointerToolSettings;
  onSettingChange: (change: Partial<PointerToolSettings>) => void;
};

function PointerToolSettings({
  settings,
  onSettingChange,
}: PointerToolSettingsProps) {
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
