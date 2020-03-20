import React from "react";
import { Flex, Box } from "theme-ui";
import shortid from "shortid";

import * as tokens from "../tokens";

import Token from "./Token";
import ProxyToken from "./ProxyToken";

const listTokenClassName = "list-token";

function Tokens({ onCreateMapToken }) {
  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onCreateMapToken) {
      // Give the token an id
      onCreateMapToken({ ...token, id: shortid.generate() });
    }
  }

  return (
    <>
      <Flex
        bg="background"
        sx={{
          width: "80px",
          minWidth: "80px",
          flexDirection: "column",
          overflowY: "auto"
        }}
        px={2}
      >
        {Object.entries(tokens).map(([id, image]) => (
          <Box key={id} m={2} sx={{ width: "48px", height: "48px" }}>
            <Token image={image} className={listTokenClassName} />
          </Box>
        ))}
      </Flex>
      <ProxyToken
        tokenClassName={listTokenClassName}
        onProxyDragEnd={handleProxyDragEnd}
      />
    </>
  );
}

export default Tokens;
