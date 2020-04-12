import React, { useRef } from "react";
import { Image } from "theme-ui";

import usePreventTouch from "../helpers/usePreventTouch";

function ListToken({ image, className }) {
  const imageRef = useRef();
  // Stop touch to prevent 3d touch gesutre on iOS
  usePreventTouch(imageRef);

  return (
    <Image
      src={image}
      ref={imageRef}
      className={className}
      sx={{ userSelect: "none", touchAction: "none" }}
    />
  );
}

export default ListToken;
