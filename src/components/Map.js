import React from "react";
import { Image, Flex, Box } from "theme-ui";

import Token from "../components/Token";
import ProxyToken from "../components/ProxyToken";

const mapTokenClassName = "map-token";

function Map({ imageSource, tokens, onMapTokenMove, onMapTokenRemove }) {
  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onMapTokenMove) {
      onMapTokenMove(token);
    }

    if (!isOnMap && onMapTokenRemove) {
      onMapTokenRemove(token);
    }
  }

  return (
    <>
      <Flex
        className="map"
        sx={{ justifyContent: "center", flexGrow: 1 }}
        bg="background"
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            userSelect: "none"
          }}
        >
          {Object.values(tokens).map(token => (
            <Box
              key={token.id}
              sx={{
                position: "absolute",
                transform: `translate(${token.x}px, ${token.y}px)`
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
        <Image src={imageSource} sx={{ objectFit: "contain" }} />
      </Flex>
      <ProxyToken
        tokenClassName={mapTokenClassName}
        onProxyDragEnd={handleProxyDragEnd}
      />
    </>
  );
}

export default Map;
