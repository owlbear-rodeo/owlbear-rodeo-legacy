import React from "react";
import { Image } from "theme-ui";

function Token({ image, className }) {
  return (
    <Image
      p={2}
      className={className}
      src={image}
      sx={{
        width: "64px",
        height: "64px"
      }}
    />
  );
}

export default Token;
