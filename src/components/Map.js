import React, { useRef, useEffect, useState } from "react";
import { Box, Image } from "theme-ui";
import interact from "interactjs";

import Token from "../components/Token";
import ProxyToken from "../components/ProxyToken";
import AddMapButton from "../components/AddMapButton";

const mapTokenClassName = "map-token";
const defaultTokenSize = 48;
const zoomSpeed = -0.005;
const minZoom = 0.1;
const maxZoom = 5;

function Map({
  mapSource,
  mapData,
  tokens,
  onMapTokenMove,
  onMapTokenRemove,
  onMapChanged
}) {
  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onMapTokenMove) {
      onMapTokenMove(token);
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
          move: event => {
            setMapScale(previousMapScale =>
              Math.max(Math.min(previousMapScale + event.ds, maxZoom), minZoom)
            );
            setMapTranslate(previousMapTranslate => ({
              x: previousMapTranslate.x + event.dx,
              y: previousMapTranslate.y + event.dy
            }));
          }
        }
      })
      .draggable({
        inertia: true,
        listeners: {
          move: event => {
            setMapTranslate(previousMapTranslate => ({
              x: previousMapTranslate.x + event.dx,
              y: previousMapTranslate.y + event.dy
            }));
          }
        }
      });
    interact(".map").on("doubletap", event => {
      event.preventDefault();
      setMapTranslate({ x: 0, y: 0 });
      setMapScale(1);
    });
  }, []);

  function handleZoom(event) {
    const deltaY = event.deltaY * zoomSpeed;
    setMapScale(previousMapScale =>
      Math.max(Math.min(previousMapScale + deltaY, maxZoom), minZoom)
    );
  }

  const mapRef = useRef(null);
  const rows = mapData && mapData.rows;
  const tokenSizePercent = (1 / rows) * 100;
  const aspectRatio = (mapData && mapData.width / mapData.height) || 1;

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
          touchAction: "none"
        }}
        bg="background"
        onWheel={handleZoom}
      >
        <Box
          sx={{
            position: "relative",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <Box
            style={{
              transform: `translate(${mapTranslate.x}px, ${mapTranslate.y}px) scale(${mapScale})`
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: 0,
                paddingBottom: `${(1 / aspectRatio) * 100}%`
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
              }}
            >
              <Image
                ref={mapRef}
                id="map"
                sx={{
                  width: "100%",
                  userSelect: "none",
                  touchAction: "none"
                }}
                src={mapSource}
              />
            </Box>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            >
              {Object.values(tokens).map(token => (
                <Box
                  key={token.id}
                  style={{
                    left: `${token.x * 100}%`,
                    top: `${token.y * 100}%`,
                    width: `${tokenSizePercent}%`
                  }}
                  sx={{
                    position: "absolute",
                    display: "flex"
                  }}
                >
                  <Token
                    tokenId={token.id}
                    image={token.image}
                    className={mapTokenClassName}
                    sx={{ position: "absolute" }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        <Box
          p={2}
          sx={{
            position: "absolute",
            top: "0",
            left: "50%",
            transform: "translateX(-50%)"
          }}
        >
          <AddMapButton onMapChanged={onMapChanged} />
        </Box>
      </Box>
      <ProxyToken
        tokenClassName={mapTokenClassName}
        onProxyDragEnd={handleProxyDragEnd}
        size={defaultTokenSize}
      />
    </>
  );
}

export default Map;
