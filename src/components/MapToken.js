import React, { useRef } from "react";
import { Box, Image } from "theme-ui";

import TokenLabel from "./TokenLabel";

import usePreventTouch from "../helpers/usePreventTouch";

function MapToken({ token, tokenSizePercent, className }) {
  const imageRef = useRef();
  // Stop touch to prevent 3d touch gesutre on iOS
  usePreventTouch(imageRef);

  return (
    <Box
      style={{
        transform: `translate(${token.x * 100}%, ${token.y * 100}%)`,
        width: "100%",
        height: "100%",
      }}
      sx={{
        position: "absolute",
        pointerEvents: "none",
      }}
    >
      <Box
        style={{
          width: `${tokenSizePercent * (token.size || 1)}%`,
        }}
        sx={{
          position: "absolute",
          pointerEvents: "all",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            display: "flex", // Set display to flex to fix height being calculated wrong
            width: "100%",
            flexDirection: "column",
          }}
        >
          <Image
            className={className}
            sx={{
              userSelect: "none",
              touchAction: "none",
              width: "100%",
            }}
            src={token.image}
            // pass data into the dom element used to pass state to the ProxyToken
            data-id={token.id}
            data-size={token.size}
            data-label={token.label}
            ref={imageRef}
          />
          {token.label && <TokenLabel label={token.label} />}
        </Box>
      </Box>
    </Box>
  );
}

export default MapToken;
