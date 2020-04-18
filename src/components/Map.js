import React, { useRef, useEffect, useState } from "react";
import { Box, Image } from "theme-ui";
import interact from "interactjs";

import ProxyToken from "./ProxyToken";
import TokenMenu from "./TokenMenu";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";
import MapControls from "./MapControls";

const mapTokenClassName = "map-token";
const zoomSpeed = -0.005;
const minZoom = 0.1;
const maxZoom = 5;

function Map({
  mapSource,
  mapData,
  tokens,
  onMapTokenChange,
  onMapTokenRemove,
  onMapChange,
}) {
  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onMapTokenChange) {
      onMapTokenChange(token);
    }

    if (!isOnMap && onMapTokenRemove) {
      onMapTokenRemove(token);
    }
  }

  const [mapTranslate, setMapTranslate] = useState({ x: 0, y: 0 });
  const [mapScale, setMapScale] = useState(1);

  useEffect(() => {
    interact(".map")
      .gesturable({
        listeners: {
          move: (event) => {
            setMapScale((previousMapScale) =>
              Math.max(Math.min(previousMapScale + event.ds, maxZoom), minZoom)
            );
            setMapTranslate((previousMapTranslate) => ({
              x: previousMapTranslate.x + event.dx,
              y: previousMapTranslate.y + event.dy,
            }));
          },
        },
      })
      .draggable({
        inertia: true,
        listeners: {
          move: (event) => {
            // setMapTranslate((previousMapTranslate) => ({
            //   x: previousMapTranslate.x + event.dx,
            //   y: previousMapTranslate.y + event.dy,
            // }));
          },
        },
      });
    interact(".map").on("doubletap", (event) => {
      event.preventDefault();
      setMapTranslate({ x: 0, y: 0 });
      setMapScale(1);
    });
  }, []);

  // Reset map transform when map changes
  useEffect(() => {
    setMapTranslate({ x: 0, y: 0 });
    setMapScale(1);
  }, [mapSource]);

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

      const deltaY = event.deltaY * zoomSpeed;
      setMapScale((previousMapScale) =>
        Math.max(Math.min(previousMapScale + deltaY, maxZoom), minZoom)
      );
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

  const mapRef = useRef(null);
  const mapContainerRef = useRef();
  const rows = mapData && mapData.rows;
  const tokenSizePercent = (1 / rows) * 100;
  const aspectRatio = (mapData && mapData.width / mapData.height) || 1;

  const mapImage = (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <Image
        ref={mapRef}
        className="mapImage"
        sx={{
          width: "100%",
          userSelect: "none",
          touchAction: "none",
        }}
        src={mapSource}
      />
    </Box>
  );

  const mapTokens = (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {Object.values(tokens).map((token) => (
        <MapToken
          key={token.id}
          token={token}
          tokenSizePercent={tokenSizePercent}
          className={mapTokenClassName}
        />
      ))}
    </Box>
  );

  return (
    <>
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
          <Box
            style={{
              transform: `translate(${mapTranslate.x}px, ${mapTranslate.y}px) scale(${mapScale})`,
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: 0,
                paddingBottom: `${(1 / aspectRatio) * 100}%`,
              }}
            />
            {mapImage}
            {mapTokens}
            <MapDrawing
              width={mapData ? mapData.width : 0}
              height={mapData ? mapData.height : 0}
            />
          </Box>
        </Box>
        <MapControls onMapChange={onMapChange} />
      </Box>
      <ProxyToken
        tokenClassName={mapTokenClassName}
        onProxyDragEnd={handleProxyDragEnd}
      />
      <TokenMenu
        tokenClassName={mapTokenClassName}
        onTokenChange={onMapTokenChange}
      />
    </>
  );
}

export default Map;
