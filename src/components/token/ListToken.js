import React, { useRef } from "react";
import { Box, Image } from "theme-ui";

import usePreventTouch from "../../helpers/usePreventTouch";
import useDataSource from "../../helpers/useDataSource";

import { tokenSources, unknownSource } from "../../tokens";

function ListToken({ token, className }) {
  const imageSource = useDataSource(token, tokenSources, unknownSource);

  const imageRef = useRef();
  // Stop touch to prevent 3d touch gesutre on iOS
  usePreventTouch(imageRef);

  return (
    <Box my={2} mx={3} sx={{ width: "48px", height: "48px" }}>
      <Image
        src={imageSource}
        ref={imageRef}
        className={className}
        sx={{
          userSelect: "none",
          touchAction: "none",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        // pass id into the dom element which is then used by the ProxyToken
        data-id={token.id}
      />
    </Box>
  );
}

export default ListToken;
