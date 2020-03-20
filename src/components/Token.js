import React from "react";
import { Image } from "theme-ui";

function Token({ image, className, tokenId }) {
  // Store the token id in the html element for the drag code to pick it up
  const idProp = tokenId ? { "data-token-id": tokenId } : {};
  return (
    <Image
      p={2}
      className={className}
      src={image}
      sx={{
        width: "64px",
        height: "64px"
      }}
      {...idProp}
    />
  );
}

export default Token;
