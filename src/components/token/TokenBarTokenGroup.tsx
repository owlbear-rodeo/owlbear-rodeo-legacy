import { useState, useRef } from "react";
import { Grid, Flex, Box } from "theme-ui";
import { useSpring, animated } from "react-spring";
import { useDraggable } from "@dnd-kit/core";

import TokenImage from "./TokenImage";
import TokenBarToken from "./TokenBarToken";

import Draggable from "../drag/Draggable";

import Vector2 from "../../helpers/Vector2";

import GroupIcon from "../../icons/GroupIcon";
import { GroupContainer } from "../../types/Group";
import { Token } from "../../types/Token";

type TokenBarTokenGroupProps = {
  group: GroupContainer;
  tokens: Token[];
  draggable: boolean;
};

function TokenBarTokenGroup({
  group,
  tokens,
  draggable,
}: TokenBarTokenGroupProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: group.id,
    disabled: !draggable,
  });
  const [isOpen, setIsOpen] = useState(false);

  const { height } = useSpring({
    height: isOpen ? (tokens.length + 1) * 56 : 56,
  });

  function renderToken(token: Token) {
    if (draggable) {
      return (
        <Draggable id={token.id} key={token.id}>
          <TokenBarToken token={token} />
        </Draggable>
      );
    } else {
      return <TokenBarToken token={token} key={token.id} />;
    }
  }

  function renderTokens() {
    if (isOpen) {
      return (
        <Grid
          columns="1fr"
          bg="muted"
          sx={{ borderRadius: "8px" }}
          p={0}
          gap={2}
        >
          <Flex
            sx={{
              width: "48px",
              height: "48px",
              alignItems: "center",
              justifyContent: "center",
              cursor: isDragging ? "grabbing" : "pointer",
              color: "primary",
            }}
            onClick={(e) => handleOpenClick(e, false)}
            key="group"
            title={group.name}
            {...listeners}
            {...attributes}
          >
            <GroupIcon />
          </Flex>
          {tokens.map(renderToken)}
        </Grid>
      );
    } else {
      return (
        <Grid
          columns="1fr 1fr"
          bg="muted"
          sx={{
            borderRadius: "8px",
            gridGap: "4px",
            height: "48px",
            gridTemplateRows: "1fr 1fr",
          }}
          p="2px"
          title={group.name}
          {...listeners}
          {...attributes}
        >
          {tokens.slice(0, 4).map((token) => (
            <TokenImage
              token={token}
              key={token.id}
              sx={{
                userSelect: "none",
                touchAction: "none",
                pointerEvents: "none",
              }}
            />
          ))}
        </Grid>
      );
    }
  }

  // Reject the opening of a group if the pointer has moved
  const clickDownPositionRef = useRef(new Vector2(0, 0));
  function handleOpenDown(event: React.PointerEvent<HTMLDivElement>) {
    clickDownPositionRef.current = new Vector2(event.clientX, event.clientY);
  }
  function handleOpenClick(
    event: React.MouseEvent<HTMLDivElement>,
    newOpen: boolean
  ) {
    const clickPosition = new Vector2(event.clientX, event.clientY);
    const distance = Vector2.distance(
      clickPosition,
      clickDownPositionRef.current
    );
    if (distance < 5) {
      setIsOpen(newOpen);
    }
  }

  return (
    <Box ref={setNodeRef}>
      <animated.div
        style={{
          padding: "4px 0",
          width: "48px",
          height,
          cursor: isOpen ? "default" : isDragging ? "grabbing" : "pointer",
        }}
        onPointerDown={handleOpenDown}
        onClick={(e) => !isOpen && handleOpenClick(e, true)}
      >
        {renderTokens()}
      </animated.div>
    </Box>
  );
}

export default TokenBarTokenGroup;
