import { useState, useRef } from "react";
import { Image as KonvaImage, Group } from "react-konva";
import { useSpring, animated } from "@react-spring/konva";
import Konva from "konva";
import useImage from "use-image";

import usePrevious from "../../hooks/usePrevious";
import useGridSnapping from "../../hooks/useGridSnapping";

import { useUserId } from "../../contexts/UserIdContext";
import {
  useSetPreventMapInteraction,
  useMapWidth,
  useMapHeight,
} from "../../contexts/MapInteractionContext";
import { useGridCellPixelSize } from "../../contexts/GridContext";
import { useDataURL } from "../../contexts/AssetsContext";

import TokenStatus from "./TokenStatus";
import TokenLabel from "./TokenLabel";
import TokenOutline from "./TokenOutline";

import { Intersection, getScaledOutline } from "../../helpers/token";
import Vector2 from "../../helpers/Vector2";

import { tokenSources } from "../../tokens";
import { TokenState } from "../../types/TokenState";
import { Map } from "../../types/Map";
import {
  TokenDragEventHandler,
  TokenMenuCloseChangeEventHandler,
  TokenMenuOpenChangeEventHandler,
  TokenStateChangeEventHandler,
} from "../../types/Events";
import Transformer from "./Transformer";
import TokenAttachment from "./TokenAttachment";

type MapTokenProps = {
  tokenState: TokenState;
  onTokenStateChange: TokenStateChangeEventHandler;
  onTokenMenuOpen: TokenMenuOpenChangeEventHandler;
  onTokenMenuClose: TokenMenuCloseChangeEventHandler;
  onTokenDragStart: TokenDragEventHandler;
  onTokenDragEnd: TokenDragEventHandler;
  draggable: boolean;
  selectable: boolean;
  fadeOnHover: boolean;
  map: Map;
  selected: boolean;
};

function Token({
  tokenState,
  onTokenStateChange,
  onTokenMenuOpen,
  onTokenMenuClose,
  onTokenDragStart,
  onTokenDragEnd,
  draggable,
  selectable,
  fadeOnHover,
  map,
  selected,
}: MapTokenProps) {
  const userId = useUserId();

  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const setPreventMapInteraction = useSetPreventMapInteraction();

  const gridCellPixelSize = useGridCellPixelSize();

  const tokenURL = useDataURL(tokenState, tokenSources);
  const [tokenImage] = useImage(tokenURL || "");

  const tokenAspectRatio = tokenState.width / tokenState.height;

  const snapPositionToGrid = useGridSnapping();

  const [dragging, setDragging] = useState(false);
  const previousDragPositionRef = useRef({ x: 0, y: 0 });

  // Tokens that are attached to this token and should move when it moves
  const attachedTokensRef = useRef<Konva.Node[]>([]);
  // If this an attachment is it over a character
  const [attachmentOverCharacter, setAttachmentOverCharacter] = useState(false);
  // The characters that we're present when an attachment is dragged, used to highlight the attachment
  const attachmentCharactersRef = useRef<Konva.Node[]>([]);
  const attachmentThreshold = Vector2.componentMin(gridCellPixelSize) / 4;

  function handleDragStart(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenGroup = event.target as Konva.Shape;
    const layer = tokenGroup.getLayer();

    if (!layer) {
      return;
    }
    previousDragPositionRef.current = tokenGroup.position();

    if (tokenState.category === "vehicle") {
      const tokenIntersection = new Intersection(
        getScaledOutline(tokenState, tokenWidth, tokenHeight),
        { x: tokenX - tokenWidth / 2, y: tokenY - tokenHeight / 2 },
        { x: tokenX, y: tokenY },
        tokenState.rotation
      );

      // Find all other characters on the map and check whether they're
      // intersecting the vehicle
      const characters = layer.find(".character");
      const attachments = layer.find(".attachment");
      const tokens = [...characters, ...attachments];
      for (let other of tokens) {
        if (other === tokenGroup) {
          continue;
        }
        if (tokenIntersection.intersects(other.position())) {
          attachedTokensRef.current.push(other);
        }
      }
    }

    if (tokenState.category === "attachment") {
      // If we're dragging an attachment add all characters to the attachment characters
      // So we can check for highlights
      previousDragPositionRef.current = tokenGroup.position();
      const characters = layer.find(".character");
      attachmentCharactersRef.current = characters;
    }

    if (tokenState.category === "character") {
      // Find all attachments and check whether they are close to the center of this token
      const attachments = layer.find(".attachment");
      for (let attachment of attachments) {
        if (attachment === tokenGroup) {
          continue;
        }
        const distance = Vector2.distance(
          tokenGroup.position(),
          attachment.position()
        );
        if (distance < attachmentThreshold) {
          attachedTokensRef.current.push(attachment);
        }
      }
    }
    setDragging(true);
    onTokenDragStart(
      event,
      tokenState.id,
      attachedTokensRef.current.map((token) => token.id())
    );
  }

  function handleDragMove(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenGroup = event.target;
    // Snap to corners of grid
    if (map.snapToGrid) {
      tokenGroup.position(snapPositionToGrid(tokenGroup.position()));
    }
    if (attachedTokensRef.current.length > 0) {
      const deltaPosition = Vector2.subtract(
        tokenGroup.position(),
        previousDragPositionRef.current
      );
      for (let other of attachedTokensRef.current) {
        other.position(Vector2.add(other.position(), deltaPosition));
      }
      previousDragPositionRef.current = tokenGroup.position();
    }
    // Check whether an attachment is over a character
    if (tokenState.category === "attachment") {
      const characters = attachmentCharactersRef.current;
      let overCharacter = false;
      for (let character of characters) {
        const distance = Vector2.distance(
          tokenGroup.position(),
          character.position()
        );
        if (distance < attachmentThreshold) {
          overCharacter = true;
          break;
        }
      }
      if (attachmentOverCharacter !== overCharacter) {
        setAttachmentOverCharacter(overCharacter);
      }
    }
  }

  function handleDragEnd(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenGroup = event.target;

    const attachedTokenChanges: Record<string, Partial<TokenState>> = {};
    if (attachedTokensRef.current.length > 0) {
      for (let other of attachedTokensRef.current) {
        attachedTokenChanges[other.id()] = {
          x: other.x() / mapWidth,
          y: other.y() / mapHeight,
          lastModifiedBy: userId,
          lastModified: Date.now(),
        };
      }
    }

    setPreventMapInteraction(false);
    onTokenStateChange({
      ...attachedTokenChanges,
      [tokenState.id]: {
        x: tokenGroup.x() / mapWidth,
        y: tokenGroup.y() / mapHeight,
        lastModifiedBy: userId,
        lastModified: Date.now(),
      },
    });

    setDragging(false);

    onTokenDragEnd(
      event,
      tokenState.id,
      attachedTokensRef.current.map((token) => token.id())
    );

    attachmentCharactersRef.current = [];
    attachedTokensRef.current = [];
    setAttachmentOverCharacter(false);
  }

  function handleClick() {
    if (selectable && draggable && tokenRef.current) {
      onTokenMenuOpen(tokenState.id, tokenRef.current);
    }
  }

  const [tokenOpacity, setTokenOpacity] = useState(1);
  // Store token pointer down time to check for a click when token is locked
  const tokenPointerDownTimeRef = useRef<number>(0);
  function handlePointerDown(event: Konva.KonvaEventObject<PointerEvent>) {
    if (draggable) {
      setPreventMapInteraction(true);
    }
    if (tokenState.locked && selectable) {
      tokenPointerDownTimeRef.current = event.evt.timeStamp;
    }
  }

  function handlePointerUp(event: Konva.KonvaEventObject<PointerEvent>) {
    if (draggable) {
      setPreventMapInteraction(false);
    }
    // Check token click when locked and selectable
    // We can't use onClick because that doesn't check pointer distance
    if (tokenState.locked && selectable && tokenRef.current) {
      // If down and up time is small trigger a click
      const delta = event.evt.timeStamp - tokenPointerDownTimeRef.current;
      if (delta < 300) {
        onTokenMenuOpen(tokenState.id, tokenRef.current);
      }
    }
  }

  function handlePointerEnter() {
    if (fadeOnHover) {
      setTokenOpacity(0.5);
    }
  }

  function handlePointerLeave() {
    if (tokenOpacity !== 1.0) {
      setTokenOpacity(1.0);
    }
  }

  const tokenRef = useRef<Konva.Group>(null);

  const [isTransforming, setIsTransforming] = useState(false);
  function handleTransformStart() {
    setIsTransforming(true);
    onTokenMenuClose();
  }

  function handleTransformEnd(event: Konva.KonvaEventObject<Event>) {
    if (tokenRef.current) {
      const sizeChange = event.target.scaleX();
      const rotation = event.target.rotation();
      onTokenStateChange({
        [tokenState.id]: {
          size: tokenState.size * sizeChange,
          rotation: rotation,
        },
      });
      tokenRef.current.scaleX(1);
      tokenRef.current.scaleY(1);
      onTokenMenuOpen(tokenState.id, tokenRef.current);
    }
    setIsTransforming(false);
  }

  const minCellSize = Math.min(
    gridCellPixelSize.width,
    gridCellPixelSize.height
  );
  const tokenWidth = minCellSize * tokenState.size;
  const tokenHeight = (minCellSize / tokenAspectRatio) * tokenState.size;

  // Animate to new token positions if edited by others
  const tokenX = tokenState.x * mapWidth;
  const tokenY = tokenState.y * mapHeight;
  const previousWidth = usePrevious(mapWidth);
  const previousHeight = usePrevious(mapHeight);
  const resized = mapWidth !== previousWidth || mapHeight !== previousHeight;
  const skipAnimation = tokenState.lastModifiedBy === userId || resized;
  const props = useSpring({
    x: tokenX,
    y: tokenY,
    immediate: skipAnimation,
  });

  // When a token is hidden if you aren't the map owner hide it completely
  if (map && !tokenState.visible && map.owner !== userId) {
    return null;
  }

  // Token name is used by on click to find whether a token is a vehicle or prop
  let tokenName = "";
  if (tokenState) {
    tokenName = tokenState.category;
  }
  if (tokenState && tokenState.locked) {
    tokenName = tokenName + "-locked";
  }

  return (
    <>
      <animated.Group
        {...props}
        width={tokenWidth}
        height={tokenHeight}
        draggable={draggable}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        opacity={tokenState.visible ? tokenOpacity : 0.5}
        name={tokenName}
        id={tokenState.id}
      >
        <Group
          ref={tokenRef}
          rotation={tokenState.rotation}
          offsetX={tokenWidth / 2}
          offsetY={tokenHeight / 2}
        >
          <Group width={tokenWidth} height={tokenHeight} x={0} y={0}>
            <TokenOutline
              outline={getScaledOutline(tokenState, tokenWidth, tokenHeight)}
              hidden={!!tokenImage}
              // Disable hit detection for attachments
              hitFunc={
                tokenState.category === "attachment" ? () => {} : undefined
              }
            />
          </Group>
          <KonvaImage
            width={tokenWidth}
            height={tokenHeight}
            x={0}
            y={0}
            image={tokenImage}
            hitFunc={() => {}}
          />
        </Group>
        {!isTransforming ? (
          <Group offsetX={tokenWidth / 2} offsetY={tokenHeight / 2}>
            {tokenState.statuses?.length > 0 ? (
              <TokenStatus
                tokenState={tokenState}
                width={tokenWidth}
                height={tokenHeight}
              />
            ) : null}
            {tokenState.category === "attachment" ? (
              <Group offsetX={-tokenWidth / 2} offsetY={-tokenHeight / 2}>
                <Group rotation={tokenState.rotation}>
                  <TokenAttachment
                    tokenHeight={tokenHeight}
                    dragging={dragging}
                    highlight={attachmentOverCharacter}
                    radius={attachmentThreshold * 2}
                  />
                </Group>
              </Group>
            ) : null}
            {tokenState.label ? (
              <TokenLabel
                tokenState={tokenState}
                width={tokenWidth}
                height={tokenHeight}
              />
            ) : null}
          </Group>
        ) : null}
      </animated.Group>
      <Transformer
        active={(!tokenState.locked && selected) || isTransforming}
        nodeRef={tokenRef}
        onTransformEnd={handleTransformEnd}
        onTransformStart={handleTransformStart}
        gridScale={map.grid.measurement.scale}
      />
    </>
  );
}

export default Token;
