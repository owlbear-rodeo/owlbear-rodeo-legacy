import React, { useState } from "react";
import { Box, SxProp } from "theme-ui";

import colors, { colorOptions, Color } from "../../../helpers/colors";
import MapMenu from "../MapMenu";

type ColorCircleProps = {
  color: Color;
  selected: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
} & SxProp;

function ColorCircle({ color, selected, onClick, sx }: ColorCircleProps) {
  return (
    <Box
      key={color}
      sx={{
        borderRadius: "50%",
        transform: "scale(0.75)",
        backgroundColor: colors[color],
        cursor: "pointer",
        ...sx,
      }}
      onClick={onClick}
      aria-label={`Brush Color ${color}`}
    >
      {selected && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            border: "2px solid white",
            position: "absolute",
            top: 0,
            borderRadius: "50%",
          }}
        />
      )}
    </Box>
  );
}

type ColorControlProps = {
  color: Color;
  onColorChange: (newColor: Color) => void;
  exclude: Color[];
};

function ColorControl({ color, onColorChange, exclude }: ColorControlProps) {
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [colorMenuOptions, setColorMenuOptions] = useState({});

  function handleControlClick(event: React.MouseEvent<HTMLDivElement>) {
    if (showColorMenu) {
      setShowColorMenu(false);
      setColorMenuOptions({});
    } else {
      setShowColorMenu(true);
      const rect = event.currentTarget.getBoundingClientRect();
      setColorMenuOptions({
        // Align the right of the submenu to the left of the tool and center vertically
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.bottom + 16}px`,
        style: { transform: "translateX(-50%)" },
        // Exclude this node from the sub menus auto close
        excludeNode: event.currentTarget,
      });
    }
  }

  const colorMenu = (
    <MapMenu
      isOpen={showColorMenu}
      onRequestClose={() => {
        setShowColorMenu(false);
        setColorMenuOptions({});
      }}
      {...colorMenuOptions}
    >
      <Box
        sx={{
          width: "104px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
        p={1}
      >
        {colorOptions
          .filter((color) => !exclude.includes(color))
          .map((c) => (
            <ColorCircle
              key={c}
              color={c}
              selected={c === color}
              onClick={() => {
                onColorChange(c);
                setShowColorMenu(false);
                setColorMenuOptions({});
              }}
              sx={{ width: "25%", paddingTop: "25%" }}
            />
          ))}
      </Box>
    </MapMenu>
  );

  return (
    <>
      <ColorCircle
        color={color}
        selected
        onClick={handleControlClick}
        sx={{ width: "24px", height: "24px" }}
      />
      {colorMenu}
    </>
  );
}

ColorControl.defaultProps = {
  exclude: [],
};

export default ColorControl;
