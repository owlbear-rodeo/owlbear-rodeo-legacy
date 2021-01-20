import React from "react";
import { Flex, Image as UIImage, IconButton, Box, Text, Badge } from "theme-ui";

import EditTileIcon from "../icons/EditTileIcon";

function Tile({
  src,
  title,
  isSelected,
  onSelect,
  onEdit,
  onDoubleClick,
  size,
  canEdit,
  badges,
  editTitle,
}) {
  let width;
  let margin;
  switch (size) {
    case "small":
      width = "24%";
      margin = "0.5%";
      break;
    case "medium":
      width = "32%";
      margin = `${2 / 3}%`;
      break;
    case "large":
      width = "48%";
      margin = "1%";
      break;
    default:
      width = "32%";
      margin = `${2 / 3}%`;
  }
  return (
    <Flex
      sx={{
        position: "relative",
        width: width,
        height: "0",
        paddingTop: width,
        borderRadius: "4px",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        overflow: "hidden",
        userSelect: "none",
      }}
      my={1}
      mx={margin}
      bg="muted"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        if (canEdit) {
          onDoubleClick(e);
        }
      }}
    >
      <UIImage
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        src={src}
      />
      <Flex
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.65) 100%);",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
        p={2}
      >
        <Text
          as="p"
          variant="heading"
          color="hsl(210, 50%, 96%)"
          sx={{ textAlign: "center" }}
        >
          {title}
        </Text>
      </Flex>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          borderColor: "primary",
          borderStyle: isSelected ? "solid" : "none",
          borderWidth: "4px",
          pointerEvents: "none",
          borderRadius: "4px",
        }}
      />
      <Box sx={{ position: "absolute", top: 0, left: 0 }}>
        {badges.map((badge, i) => (
          <Badge m={2} key={i} bg="overlay">
            {badge}
          </Badge>
        ))}
      </Box>
      {canEdit && (
        <Box sx={{ position: "absolute", top: 0, right: 0 }}>
          <IconButton
            aria-label={editTitle}
            title={editTitle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            bg="overlay"
            sx={{ borderRadius: "50%" }}
            m={2}
          >
            <EditTileIcon />
          </IconButton>
        </Box>
      )}
    </Flex>
  );
}

Tile.defaultProps = {
  src: "",
  title: "",
  isSelected: false,
  onSelect: () => {},
  onEdit: () => {},
  onDoubleClick: () => {},
  size: "medium",
  canEdit: false,
  badges: [],
  editTitle: "Edit",
};

export default Tile;
