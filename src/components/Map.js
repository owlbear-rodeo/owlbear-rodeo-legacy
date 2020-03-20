import React, { useRef } from "react";
import { Box, Image } from "theme-ui";

import Token from "../components/Token";
import ProxyToken from "../components/ProxyToken";

const mapTokenClassName = "map-token";
const defaultTokenSize = 48;

function Map({ mapSource, mapData, tokens, onMapTokenMove, onMapTokenRemove }) {
  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onMapTokenMove) {
      onMapTokenMove(token);
    }

    if (!isOnMap && onMapTokenRemove) {
      onMapTokenRemove(token);
    }
  }

  const mapRef = useRef(null);
  const rows = mapData && mapData.rows;
  const tokenSizePercent = (1 / rows) * 100;
  const aspectRatio = (mapData && mapData.width / mapData.height) || 1;

  return (
    <>
      <Box
        className="map"
        sx={{ flexGrow: 1, position: "relative", overflow: "hidden" }}
        bg="background"
      >
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
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
            sx={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <Image ref={mapRef} id="map" src={mapSource} />
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
                />
              </Box>
            ))}
          </Box>
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
