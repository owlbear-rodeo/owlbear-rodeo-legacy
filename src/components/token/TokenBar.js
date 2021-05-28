import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Box, Flex } from "theme-ui";
import SimpleBar from "simplebar-react";
import { DragOverlay, DndContext } from "@dnd-kit/core";

import TokenBarToken from "./TokenBarToken";
import TokenBarTokenGroup from "./TokenBarTokenGroup";
import SelectTokensButton from "./SelectTokensButton";

import Draggable from "../drag/Draggable";

import useSetting from "../../hooks/useSetting";

import { useTokenData } from "../../contexts/TokenDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useMapStage } from "../../contexts/MapStageContext";

import {
  createTokenState,
  clientPositionToMapPosition,
} from "../../helpers/token";

function TokenBar({ onMapTokenStateCreate }) {
  const { userId } = useAuth();
  const { tokensById, tokenGroups } = useTokenData();
  const [fullScreen] = useSetting("map.fullScreen");

  const [dragId, setDragId] = useState();

  const mapStageRef = useMapStage();
  // Use a ref to the drag overlay to get it's position on dragEnd
  // TODO: use active.rect when dnd-kit bug is fixed
  // https://github.com/clauderic/dnd-kit/issues/238
  const dragOverlayRef = useRef();

  function handleDragStart({ active }) {
    setDragId(active.id);
  }

  function handleDragEnd({ active }) {
    setDragId(null);

    const mapStage = mapStageRef.current;
    const dragOverlay = dragOverlayRef.current;
    if (mapStage && dragOverlay) {
      const dragRect = dragOverlay.getBoundingClientRect();
      const dragPosition = {
        x: dragRect.left + dragRect.width / 2,
        y: dragRect.top + dragRect.height / 2,
      };
      const mapPosition = clientPositionToMapPosition(mapStage, dragPosition);
      const token = tokensById[active.id];
      if (token && mapPosition) {
        const tokenState = createTokenState(token, mapPosition, userId);
        onMapTokenStateCreate(tokenState);
      }
    }
  }

  function renderTokens() {
    let tokens = [];
    for (let group of tokenGroups) {
      if (group.type === "item") {
        const token = tokensById[group.id];
        if (token && !token.hideInSidebar) {
          tokens.push(
            <Draggable id={token.id} key={token.id}>
              <TokenBarToken token={token} />
            </Draggable>
          );
        }
      } else {
        const groupTokens = [];
        for (let item of group.items) {
          const token = tokensById[item.id];
          if (token && !token.hideInSidebar) {
            groupTokens.push(token);
          }
        }
        tokens.push(
          <TokenBarTokenGroup
            group={group}
            tokens={groupTokens}
            key={group.id}
          />
        );
      }
    }
    return tokens;
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      autoScroll={false}
    >
      <Box
        sx={{
          height: "100%",
          width: "80px",
          minWidth: "80px",
          overflowY: "hidden",
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
          <Flex sx={{ flexDirection: "column" }}>{renderTokens()}</Flex>
        </SimpleBar>
        <Flex
          bg="muted"
          sx={{
            justifyContent: "center",
            height: "48px",
            alignItems: "center",
          }}
        >
          <SelectTokensButton onMapTokenStateCreate={onMapTokenStateCreate} />
        </Flex>
        {createPortal(
          <DragOverlay
            // Ensure a drop animation plays to allow us to get the position of the drag overlay in drag end
            dropAnimation={{
              dragSourceOpacity: 0,
              duration: 1,
              easing: "ease",
            }}
          >
            {dragId && (
              <div ref={dragOverlayRef}>
                <TokenBarToken token={tokensById[dragId]} />
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </Box>
    </DndContext>
  );
}

export default TokenBar;
