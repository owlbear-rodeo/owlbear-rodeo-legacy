import React from "react";
import { Image } from "theme-ui";

import { fromEntries } from "../helpers/shared";

// The data prop is used to pass data into the dom element
// this can be used to pass state to the ProxyToken
function Token({ image, className, data, sx }) {
  // Map the keys in data to have the `data-` prefix
  const dataProps = fromEntries(
    Object.entries(data).map(([key, value]) => [`data-${key}`, value])
  );
  return (
    <Image
      className={className}
      sx={{ userSelect: "none", touchAction: "none", ...sx }}
      src={image}
      {...dataProps}
    />
  );
}

Token.defaultProps = {
  data: {},
  sx: {},
};

export default Token;
