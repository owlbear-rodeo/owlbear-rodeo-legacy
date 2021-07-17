import { useState } from "react";
import { Image, Box, ImageProps } from "theme-ui";

import { useDataURL } from "../../contexts/AssetsContext";

import { tokenSources as defaultTokenSources } from "../../tokens";
import { Token } from "../../types/Token";

import { TokenOutlineSVG } from "./TokenOutline";

type TokenImageProps = {
  token: Token;
} & ImageProps;

function TokenImage({ token, ...props }: TokenImageProps) {
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
          sx={{ width: "100%", height: "100%", minHeight: 0 }}
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
        style={showOutline ? { display: "none" } : props.style}
        {...props}
      />
    </>
  );
}

export default TokenImage;
