import React from "react";
import { Image } from "theme-ui";

function Token({ image, className, tokenId }) {
  // Store the token id in the html element for the drag code to pick it up
  const idProp = tokenId ? { "data-token-id": tokenId } : {};
  return (
    <Image
      className={className}
      sx={{ userSelect: "none" }}
      src={image}
      {...idProp}
    />
  );
}

export default Token;
