import React, { useRef } from "react";
import { Box } from "theme-ui";

import usePreventTouch from "../../hooks/usePreventTouch";

import TokenImage from "./TokenImage";

function ListToken({ token }) {
  const imageRef = useRef();
  // Stop touch to prevent 3d touch gesutre on iOS
  usePreventTouch(imageRef);

  return (
    <Box py={1} sx={{ width: "48px", height: "56px" }}>
      <TokenImage
        token={token}
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
