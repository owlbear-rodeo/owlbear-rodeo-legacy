import React, { useState } from "react";
import { Image, Box } from "theme-ui";

import { useDataURL } from "../../contexts/AssetsContext";

import { tokenSources as defaultTokenSources } from "../../tokens";

import { TokenOutlineSVG } from "./TokenOutline";

const TokenImage = React.forwardRef(({ token, ...props }, ref) => {
  const tokenURL = useDataURL(
    token,
    defaultTokenSources,
    undefined,
    token.type === "file"
  );

  const [showOutline, setShowOutline] = useState(true);

  return (
    <>
      {showOutline && (
        <Box
          title={props.alt}
          aria-label={props.alt}
          sx={{ width: "100%", height: "100%" }}
        >
          <TokenOutlineSVG
            outline={token.outline}
            width={token.width}
            height={token.height}
          />
        </Box>
      )}
      <Image
        onLoad={() => setShowOutline(false)}
        src={tokenURL}
        ref={ref}
        style={showOutline ? { display: "none" } : props.style}
        {...props}
      />
    </>
  );
});

export default TokenImage;
