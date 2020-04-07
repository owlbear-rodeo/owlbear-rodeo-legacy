import React, { useState } from "react";
import { Flex, Box } from "theme-ui";
import shortid from "shortid";

import * as tokens from "../tokens";

import Token from "./Token";
import ProxyToken from "./ProxyToken";
import SizeInput from "./SizeInput";

const listTokenClassName = "list-token";

function Tokens({ onCreateMapToken }) {
  const [tokenSize, setTokenSize] = useState(1);

  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onCreateMapToken) {
      // Give the token an id
      onCreateMapToken({ ...token, id: shortid.generate(), size: tokenSize });
    }
  }

  return (
    <>
      <Flex sx={{ flexDirection: "column" }}>
        <Flex
          bg="background"
          sx={{
            width: "80px",
            minWidth: "80px",
            flexDirection: "column",
            overflowY: "auto",
          }}
          px={2}
        >
          {Object.entries(tokens).map(([id, image]) => (
            <Box key={id} m={2} sx={{ width: "48px", height: "48px" }}>
              <Token image={image} className={listTokenClassName} />
            </Box>
          ))}
        </Flex>
        <Box
          pt={1}
          sx={{
            backgroundColor: "muted",
          }}
        >
          <SizeInput value={tokenSize} onChange={setTokenSize} />
        </Box>
      </Flex>
      <ProxyToken
        tokenClassName={listTokenClassName}
        onProxyDragEnd={handleProxyDragEnd}
      />
    </>
  );
}

export default Tokens;
