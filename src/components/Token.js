import React from "react";
import { Image } from "theme-ui";

function Token({ image, className, tokenId, sx }) {
  // Store the token id in the html element for the drag code to pick it up
  const idProp = tokenId ? { "data-token-id": tokenId } : {};
  return (
    <Image
      className={className}
      sx={{ userSelect: "none", touchAction: "none", ...sx }}
      src={image}
      {...idProp}
    />
  );
}

Token.defaultProps = {
  sx: {}
};

export default Token;
