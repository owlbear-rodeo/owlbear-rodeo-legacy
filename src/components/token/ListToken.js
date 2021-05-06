import React, { useRef } from "react";
import { Box, Image } from "theme-ui";

import usePreventTouch from "../../hooks/usePreventTouch";

import { useDataURL } from "../../contexts/AssetsContext";

import { tokenSources, unknownSource } from "../../tokens";

function ListToken({ token }) {
  const tokenURL = useDataURL(
    token,
    tokenSources,
    unknownSource,
    token.type === "file"
  );

  const imageRef = useRef();
  // Stop touch to prevent 3d touch gesutre on iOS
  usePreventTouch(imageRef);

  return (
    <Box py={1} sx={{ width: "48px", height: "56px" }}>
      <Image
        src={tokenURL}
        ref={imageRef}
        sx={{
          userSelect: "none",
          touchAction: "none",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        alt={token.name}
        title={token.name}
      />
    </Box>
  );
}

export default ListToken;
