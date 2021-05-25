import React, { useState } from "react";
import { Grid, Flex } from "theme-ui";
import { useSpring, animated } from "react-spring";

import TokenImage from "./TokenImage";
import TokenBarToken from "./TokenBarToken";

import Draggable from "../drag/Draggable";

import GroupIcon from "../../icons/GroupIcon";

function TokenBarTokenGroup({ group, tokens }) {
  const [isOpen, setIsOpen] = useState(false);

  const { height } = useSpring({
    height: isOpen ? (tokens.length + 1) * 56 : 56,
  });

  function renderTokens() {
    if (isOpen) {
      return (
        <>
          <Flex
            sx={{
              width: "48px",
              height: "48px",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "primary",
            }}
            onClick={() => setIsOpen(false)}
            key="group"
            alt={group.name}
            title={group.name}
          >
            <GroupIcon />
          </Flex>
          {tokens.map((token) => (
            <Draggable id={token.id} key={token.id}>
              <TokenBarToken token={token} />
            </Draggable>
          ))}
        </>
      );
    } else {
      return tokens.slice(0, 4).map((token) => (
        <TokenImage
          token={token}
          key={token.id}
          sx={{
            userSelect: "none",
            touchAction: "none",
          }}
        />
      ));
    }
  }

  return (
    <animated.div
      style={{
        padding: "4px 0",
        width: "48px",
        height,
        cursor: isOpen ? "default" : "pointer",
      }}
      onClick={() => !isOpen && setIsOpen(true)}
    >
      <Grid
        columns={isOpen ? "1fr" : "2fr 2fr"}
        alt={group.name}
        title={group.name}
        bg="muted"
        sx={{ borderRadius: "8px", gridGap: isOpen ? 0 : "4px" }}
        p={isOpen ? 0 : "2px"}
      >
        {renderTokens()}
      </Grid>
    </animated.div>
  );
}

export default TokenBarTokenGroup;
