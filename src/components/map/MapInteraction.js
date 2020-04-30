import React, { useRef, useEffect } from "react";
import { Box } from "theme-ui";
import interact from "interactjs";
import normalizeWheel from "normalize-wheel";

import { MapInteractionProvider } from "../../contexts/MapInteractionContext";

const zoomSpeed = -0.001;
const minZoom = 0.1;
const maxZoom = 5;

function MapInteraction({ map, aspectRatio, isEnabled, children, controls }) {
  const mapContainerRef = useRef();
  const mapMoveContainerRef = useRef();
  const mapTranslateRef = useRef({ x: 0, y: 0 });
  const mapScaleRef = useRef(1);
  function setTranslateAndScale(newTranslate, newScale) {
    const moveContainer = mapMoveContainerRef.current;
    moveContainer.style.transform = `translate(${newTranslate.x}px, ${newTranslate.y}px) scale(${newScale})`;
    mapScaleRef.current = newScale;
    mapTranslateRef.current = newTranslate;
  }

  useEffect(() => {
    function handleMove(event, isGesture) {
      const scale = mapScaleRef.current;
      const translate = mapTranslateRef.current;

      let newScale = scale;
      let newTranslate = translate;

      if (isGesture) {
        newScale = Math.max(Math.min(scale + event.ds, maxZoom), minZoom);
      }

      if (isEnabled || isGesture) {
        newTranslate = {
          x: translate.x + event.dx,
          y: translate.y + event.dy,
        };
      }
      setTranslateAndScale(newTranslate, newScale);
    }
    const mapInteract = interact(".map")
      .gesturable({
        listeners: {
          move: (e) => handleMove(e, true),
        },
      })
      .draggable({
        inertia: true,
        listeners: {
          move: (e) => handleMove(e, false),
        },
        cursorChecker: () => {
          return isEnabled && map ? "move" : "default";
        },
      })
      .on("doubletap", (event) => {
        event.preventDefault();
        if (isEnabled) {
          setTranslateAndScale({ x: 0, y: 0 }, 1);
        }
      });

    return () => {
      mapInteract.unset();
    };
  }, [isEnabled, map]);

  // Reset map transform when map changes
  useEffect(() => {
    setTranslateAndScale({ x: 0, y: 0 }, 1);
  }, [map]);

  // Bind the wheel event of the map via a ref
  // in order to support non-passive event listening
  // to allow the track pad zoom to be interrupted
  // see https://github.com/facebook/react/issues/14856
  useEffect(() => {
    const mapContainer = mapContainerRef.current;

    function handleZoom(event) {
      // Stop overscroll on chrome and safari
      // also stop pinch to zoom on chrome
      event.preventDefault();

      // Try and normalize the wheel event to prevent OS differences for zoom speed
      const normalized = normalizeWheel(event);

      const scale = mapScaleRef.current;
      const translate = mapTranslateRef.current;

      const deltaY = normalized.pixelY * zoomSpeed;
      const newScale = Math.max(Math.min(scale + deltaY, maxZoom), minZoom);

      setTranslateAndScale(translate, newScale);
    }

    if (mapContainer) {
      mapContainer.addEventListener("wheel", handleZoom, {
        passive: false,
      });
    }

    return () => {
      if (mapContainer) {
        mapContainer.removeEventListener("wheel", handleZoom);
      }
    };
  }, []);

  return (
    <Box
      className="map"
      sx={{
        flexGrow: 1,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        userSelect: "none",
        touchAction: "none",
      }}
      bg="background"
      ref={mapContainerRef}
    >
      <Box
        sx={{
          position: "relative",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Box ref={mapMoveContainerRef}>
          <Box
            sx={{
              width: "100%",
              height: 0,
              paddingBottom: `${(1 / aspectRatio) * 100}%`,
            }}
          />
          <MapInteractionProvider
            value={{
              translateRef: mapTranslateRef,
              scaleRef: mapScaleRef,
            }}
          >
            {children}
          </MapInteractionProvider>
        </Box>
      </Box>
      {controls}
    </Box>
  );
}

export default MapInteraction;
