import { Flex } from "theme-ui";

import {
  SelectToolSettings as SelectToolSettingsType,
  SelectToolType,
} from "../../../types/Select";

import { useKeyboard } from "../../../contexts/KeyboardContext";

import ToolSection from "./ToolSection";

import shortcuts from "../../../shortcuts";

import RectIcon from "../../../icons/SelectRectangleIcon";
import PathIcon from "../../../icons/SelectPathIcon";

type SelectToolSettingsProps = {
  settings: SelectToolSettingsType;
  onSettingChange: (change: Partial<SelectToolSettingsType>) => void;
};

function SelectToolSettings({
  settings,
  onSettingChange,
}: SelectToolSettingsProps) {
  // Keyboard shotcuts
  function handleKeyDown(event: KeyboardEvent) {
    if (shortcuts.selectPath(event)) {
      onSettingChange({ type: "path" });
    } else if (shortcuts.selectRect(event)) {
      onSettingChange({ type: "rectangle" });
    }
  }
  useKeyboard(handleKeyDown);

  const tools = [
    {
      id: "path",
      title: "Lasso Selection (L)",
      isSelected: settings.type === "path",
      icon: <PathIcon />,
    },
    {
      id: "rectangle",
      title: "Rectangle Selection (R)",
      isSelected: settings.type === "rectangle",
      icon: <RectIcon />,
    },
  ];

  return (
    <Flex sx={{ alignItems: "center" }}>
      <ToolSection
        tools={tools}
        onToolClick={(tool) =>
          onSettingChange({ type: tool.id as SelectToolType })
        }
      />
    </Flex>
  );
}

export default SelectToolSettings;
