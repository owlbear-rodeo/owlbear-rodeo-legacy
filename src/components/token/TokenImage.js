import React from "react";
import { Image } from "theme-ui";

import { useDataURL } from "../../contexts/AssetsContext";

import { tokenSources as defaultTokenSources } from "../../tokens";

const TokenImage = React.forwardRef(({ token, ...props }) => {
  const tokenURL = useDataURL(
    token,
    defaultTokenSources,
    undefined,
    token.type === "file"
  );

  return <Image src={tokenURL} {...props} />;
});

export default TokenImage;
