import React from "react";
import { Image } from "theme-ui";

import { useDataURL } from "../../contexts/AssetsContext";

import { tokenSources as defaultTokenSources } from "../../tokens";

function TokenTileImage({ token, sx }) {
  const tokenURL = useDataURL(
    token,
    defaultTokenSources,
    undefined,
    token.type === "file"
  );

  return <Image sx={sx} src={tokenURL}></Image>;
}

export default TokenTileImage;
