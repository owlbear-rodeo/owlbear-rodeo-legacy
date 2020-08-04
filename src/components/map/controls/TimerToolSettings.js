import React, { useEffect, useContext } from "react";
import { Flex, Input, Text, IconButton } from "theme-ui";

import Divider from "../../Divider";

import MapInteractionContext from "../../../contexts/MapInteractionContext";
import TimerStartIcon from "../../../icons/TimerStartIcon";

function MeasureToolSettings({ settings, onSettingChange, onToolAction }) {
  const { interactionEmitter } = useContext(MapInteractionContext);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown({ key }) {}
    interactionEmitter.on("keyDown", handleKeyDown);

    return () => {
      interactionEmitter.off("keyDown", handleKeyDown);
    };
  });

  const inputStyle = {
    width: "40px",
    border: "none",
    ":focus": {
      outline: "none",
    },
    lineHeight: 1.2,
    padding: 1,
    paddingRight: 0,
  };

  return (
    <Flex sx={{ alignItems: "center" }}>
      <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
        h:
      </Text>
      <Input
        sx={inputStyle}
        value={settings.hour}
        onChange={(e) => onSettingChange({ hour: parseInt(e.target.value) })}
        type="number"
        min={0}
        max={99}
      />
      <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
        m:
      </Text>
      <Input
        sx={inputStyle}
        value={settings.minute}
        onChange={(e) => onSettingChange({ minute: parseInt(e.target.value) })}
        type="number"
        min={0}
        max={59}
      />
      <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
        s:
      </Text>
      <Input
        sx={inputStyle}
        value={settings.second}
        onChange={(e) => onSettingChange({ second: parseInt(e.target.value) })}
        type="number"
        min={0}
        max={59}
      />
      <IconButton
        aria-label="Start Timer"
        title="Start Timer"
        onClick={() => onToolAction("timerStart")}
        disabled={
          settings.hour === 0 && settings.minute === 0 && settings.second === 0
        }
      >
        <TimerStartIcon />
      </IconButton>
    </Flex>
  );
}

export default MeasureToolSettings;
