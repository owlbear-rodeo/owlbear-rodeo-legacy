import React from "react";
import { Image, Flex, Box } from "theme-ui";

import Token from "../components/Token";

function Map({ imageSource, tokens }) {
  return (
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
            <Token image={token.image} className="map-token" />
          </Box>
        ))}
      </Box>
      <Image src={imageSource} sx={{ objectFit: "contain" }} />
    </Flex>
  );
}

export default Map;
