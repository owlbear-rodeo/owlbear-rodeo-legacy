import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Box, Flex } from "theme-ui";
import SimpleBar from "simplebar-react";
import {
  DragOverlay,
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import TokenBarToken from "./TokenBarToken";
import TokenBarTokenGroup from "./TokenBarTokenGroup";
import SelectTokensButton from "./SelectTokensButton";

import Draggable from "../drag/Draggable";

import useSetting from "../../hooks/useSetting";
import usePreventSelect from "../../hooks/usePreventSelect";

import { useTokenData } from "../../contexts/TokenDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useMapStage } from "../../contexts/MapStageContext";

import {
  createTokenState,
  clientPositionToMapPosition,
} from "../../helpers/token";
import { findGroup } from "../../helpers/group";
import Vector2 from "../../helpers/Vector2";

function TokenBar({ onMapTokensStateCreate }) {
  const { userId } = useAuth();
  const { tokensById, tokenGroups } = useTokenData();
  const [fullScreen] = useSetting("map.fullScreen");

  const [dragId, setDragId] = useState();

  const mapStageRef = useMapStage();
  // Use a ref to the drag overlay to get it's position on dragEnd
  // TODO: use active.rect when dnd-kit bug is fixed
  // https://github.com/clauderic/dnd-kit/issues/238
  const dragOverlayRef = useRef();

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { distance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const [preventSelect, resumeSelect] = usePreventSelect();

  function handleDragStart({ active }) {
    setDragId(active.id);
    preventSelect();
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
      const group = findGroup(tokenGroups, active.id);
      if (group && mapPosition) {
        if (group.type === "item") {
          const token = tokensById[group.id];
          const tokenState = createTokenState(token, mapPosition, userId);
          onMapTokensStateCreate([tokenState]);
        } else {
          let tokenStates = [];
          let offset = new Vector2(0, 0);
          for (let item of group.items) {
            const token = tokensById[item.id];
            if (token && !token.hideInSidebar) {
              tokenStates.push(
                createTokenState(
                  token,
                  Vector2.add(mapPosition, offset),
                  userId
                )
              );
              offset = Vector2.add(offset, 0.01);
            }
          }
          if (tokenStates.length > 0) {
            onMapTokensStateCreate(tokenStates);
          }
        }
      }
    }

    resumeSelect();
  }

  function handleDragCancel() {
    setDragId(null);
    resumeSelect();
  }

  function renderToken(group, draggable = true) {
    if (group.type === "item") {
      const token = tokensById[group.id];
      if (token && !token.hideInSidebar) {
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
    } else {
      const groupTokens = [];
      for (let item of group.items) {
        const token = tokensById[item.id];
        if (token && !token.hideInSidebar) {
          groupTokens.push(token);
        }
      }
      if (groupTokens.length > 0) {
        return (
          <TokenBarTokenGroup
            group={group}
            tokens={groupTokens}
            key={group.id}
            draggable={draggable}
          />
        );
      }
    }
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      autoScroll={false}
      sensors={sensors}
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
          <Flex sx={{ flexDirection: "column" }}>
            {tokenGroups.map((group) => renderToken(group))}
          </Flex>
        </SimpleBar>
        <Flex
          bg="muted"
          sx={{
            justifyContent: "center",
            height: "48px",
            alignItems: "center",
          }}
        >
          <SelectTokensButton onMapTokensStateCreate={onMapTokensStateCreate} />
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
                {renderToken(findGroup(tokenGroups, dragId), false)}
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
