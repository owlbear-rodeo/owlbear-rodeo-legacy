import React from "react";
import { createPortal } from "react-dom";
import { Box, Flex } from "theme-ui";
import SimpleBar from "simplebar-react";
import { DragOverlay } from "@dnd-kit/core";

import ListToken from "./ListToken";
import SelectTokensButton from "./SelectTokensButton";
import Draggable from "../Draggable";

import useSetting from "../../hooks/useSetting";

import { useTokenData } from "../../contexts/TokenDataContext";
import { useDragId } from "../../contexts/DragContext";

function TokenBar() {
  const { ownedTokens } = useTokenData();
  const [fullScreen] = useSetting("map.fullScreen");

  const activeDragId = useDragId();

  return (
    <Box
      sx={{
        height: "100%",
        width: "80px",
        minWidth: "80px",
        overflowY: "scroll",
        overflowX: "hidden",
        display: fullScreen ? "none" : "block",
      }}
    >
      <SimpleBar
        style={{
          height: "calc(100% - 48px)",
          overflowX: "hidden",
          padding: "0 16px",
        }}
      >
        {ownedTokens
          .filter((token) => !token.hideInSidebar)
          .map((token) => (
            <Draggable
              id={`sidebar-${token.id}`}
              key={token.id}
              data={{ tokenId: token.id }}
            >
              <ListToken token={token} />
            </Draggable>
          ))}
      </SimpleBar>
      <Flex
        bg="muted"
        sx={{
          justifyContent: "center",
          height: "48px",
          alignItems: "center",
        }}
      >
        <SelectTokensButton />
      </Flex>
      {createPortal(
        <DragOverlay>
          {activeDragId && (
            <ListToken
              token={ownedTokens.find(
                (token) => `sidebar-${token.id}` === activeDragId
              )}
            />
          )}
        </DragOverlay>,
        document.body
      )}
    </Box>
  );
}

export default TokenBar;
