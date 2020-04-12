import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Image, Box } from "theme-ui";
import interact from "interactjs";

import usePortal from "../helpers/usePortal";

function ProxyToken({ tokenClassName, onProxyDragEnd }) {
  const proxyContainer = usePortal("root");

  const [imageSource, setImageSource] = useState("");
  const imageRef = useRef();

  const proxyOnMap = useRef(false);

  useEffect(() => {
    interact(`.${tokenClassName}`).draggable({
      listeners: {
        start: (event) => {
          let target = event.target;
          // Hide the token and copy it's image to the proxy
          target.style.opacity = "0.25";
          setImageSource(target.src);

          let proxy = imageRef.current;
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
          let proxy = imageRef.current;
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
            if (proxyContainer) {
              const proxyContainerRect = proxyContainer.getBoundingClientRect();
              const proxyRect = proxy.getBoundingClientRect();
              // TODO: Look into a better method than hardcoding these values
              proxyOnMap.current =
                proxyContainerRect.right - proxyRect.right > 80 &&
                proxyRect.left > 112;
            }

            // update the posiion attributes
            proxy.setAttribute("data-x", x);
            proxy.setAttribute("data-y", y);
          }
        },

        end: (event) => {
          let target = event.target;
          let proxy = imageRef.current;
          if (proxy) {
            if (onProxyDragEnd) {
              // TODO: look at cleaning this up with a props instead of
              // hard coding an id
              const map = document.getElementById("map");
              const mapRect = map.getBoundingClientRect();

              let x = parseFloat(proxy.getAttribute("data-x")) || 0;
              let y = parseFloat(proxy.getAttribute("data-y")) || 0;
              // Convert coordiantes to be relative to the map
              x = x - mapRect.left;
              y = y - mapRect.top;
              // Normalize to map width
              x = x / (mapRect.right - mapRect.left);
              y = y / (mapRect.bottom - mapRect.top);

              target.setAttribute("data-x", x);
              target.setAttribute("data-y", y);

              onProxyDragEnd(proxyOnMap.current, {
                image: imageSource,
                // Pass in props stored as data- in the dom node
                ...target.dataset,
              });
            }

            // Reset the proxy position
            proxy.style.transform = "translate(0px, 0px)";
            proxy.setAttribute("data-x", 0);
            proxy.setAttribute("data-y", 0);
          }

          // Show the token
          target.style.opacity = "1";
          setImageSource("");
        },
      },
    });
  }, [imageSource, onProxyDragEnd, tokenClassName, proxyContainer]);

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
      <Image
        src={imageSource}
        sx={{
          touchAction: "none",
          userSelect: "none",
          position: "absolute",
        }}
        ref={imageRef}
      />
    </Box>,
    proxyContainer
  );
}

export default ProxyToken;
