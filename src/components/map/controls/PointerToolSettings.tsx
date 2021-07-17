import { Flex } from "theme-ui";

import ColorControl from "./ColorControl";

import { PointerToolSettings as PointerToolSettingsType } from "../../../types/Pointer";

type PointerToolSettingsProps = {
  settings: PointerToolSettingsType;
  onSettingChange: (change: Partial<PointerToolSettingsType>) => void;
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
        exclude={["black", "darkGray", "lightGray", "white", "primary"]}
      />
    </Flex>
  );
}

export default PointerToolSettings;
