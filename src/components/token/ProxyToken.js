import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Image, Box } from "theme-ui";
import interact from "interactjs";

import usePortal from "../../hooks/usePortal";

import { useMapStage } from "../../contexts/MapStageContext";

/**
 * @callback onProxyDragEnd
 * @param {boolean} isOnMap whether the token was dropped on the map
 * @param {Object} token the token that was dropped
 */

/**
 *
 * @param {string} tokenClassName The class name to attach the interactjs handler to
 * @param {onProxyDragEnd} onProxyDragEnd Called when the proxy token is dropped
 * @param {Object} tokens An optional mapping of tokens to use as a base when calling OnProxyDragEnd

 */
function ProxyToken({ tokenClassName, onProxyDragEnd, tokens }) {
  const proxyContainer = usePortal("root");

  const [imageSource, setImageSource] = useState("");
  const proxyRef = useRef();

  // Store the tokens in a ref and access in the interactjs loop
  // This is needed to stop interactjs from creating multiple listeners
  const tokensRef = useRef(tokens);
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const proxyOnMap = useRef(false);
  const mapStageRef = useMapStage();

  useEffect(() => {
    interact(`.${tokenClassName}`).draggable({
      listeners: {
        start: (event) => {
          let target = event.target;

          // Hide the token and copy it's image to the proxy
          target.parentElement.style.opacity = "0.25";
          setImageSource(target.src);

          let proxy = proxyRef.current;
          if (proxy) {
            // Find and set the initial offset of the token to the proxy
            const proxyRect = proxy.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const xOffset = targetRect.left - proxyRect.left;
            const yOffset = targetRect.top - proxyRect.top;
            proxy.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            proxy.setAttribute("data-x", xOffset);
            proxy.setAttribute("data-y", yOffset);

            // Copy width and height of target
            proxy.style.width = `${targetRect.width}px`;
            proxy.style.height = `${targetRect.height}px`;
          }
        },

        move: (event) => {
          let proxy = proxyRef.current;
          // Move the proxy based off of the movment of the token
          if (proxy) {
            // keep the dragged position in the data-x/data-y attributes
            const x =
              (parseFloat(proxy.getAttribute("data-x")) || 0) + event.dx;
            const y =
              (parseFloat(proxy.getAttribute("data-y")) || 0) + event.dy;
            proxy.style.transform = `translate(${x}px, ${y}px)`;

            // Check whether the proxy is on the right or left hand side of the screen
            // if not set proxyOnMap to true
            const proxyRect = proxy.getBoundingClientRect();
            const map = document.querySelector(".map");
            const mapRect = map.getBoundingClientRect();
            proxyOnMap.current =
              proxyRect.left > mapRect.left && proxyRect.right < mapRect.right;

            // update the posiion attributes
            proxy.setAttribute("data-x", x);
            proxy.setAttribute("data-y", y);
          }
        },

        end: (event) => {
          let target = event.target;
          const id = target.dataset.id;
          let proxy = proxyRef.current;
          if (proxy) {
            const mapStage = mapStageRef.current;
            if (onProxyDragEnd && mapStage) {
              const mapImage = mapStage.findOne("#mapImage");
              const map = document.querySelector(".map");
              const mapRect = map.getBoundingClientRect();
              const position = {
                x: event.clientX - mapRect.left,
                y: event.clientY - mapRect.top,
              };
              const transform = mapImage.getAbsoluteTransform().copy().invert();
              const relativePosition = transform.point(position);
              const normalizedPosition = {
                x: relativePosition.x / mapImage.width(),
                y: relativePosition.y / mapImage.height(),
              };
              // Get the token from the supplied tokens if it exists
              const token = tokensRef.current[id] || {};
              onProxyDragEnd(proxyOnMap.current, {
                ...token,
                x: normalizedPosition.x,
                y: normalizedPosition.y,
              });
            }

            // Reset the proxy position
            proxy.style.transform = "translate(0px, 0px)";
            proxy.setAttribute("data-x", 0);
            proxy.setAttribute("data-y", 0);
          }

          // Show the token
          target.parentElement.style.opacity = "1";
          setImageSource("");
        },
      },
    });
  }, [onProxyDragEnd, tokenClassName, proxyContainer, mapStageRef]);

  if (!imageSource) {
    return null;
  }

  // Create a portal to allow the proxy to move past the bounds of the token
  return ReactDOM.createPortal(
    <Box
      sx={{
        position: "absolute",
        overflow: "hidden",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }}
    >
      <Box
        sx={{ position: "absolute", display: "flex", flexDirection: "column" }}
        ref={proxyRef}
      >
        <Image
          src={imageSource}
          sx={{
            touchAction: "none",
            userSelect: "none",
            width: "100%",
          }}
        />
      </Box>
    </Box>,
    proxyContainer
  );
}

ProxyToken.defaultProps = {
  tokens: {},
};

export default ProxyToken;
