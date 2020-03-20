import React from "react";
import { Flex } from "theme-ui";
import shortid from "shortid";

import * as tokens from "../tokens";

import Token from "./Token";
import ProxyToken from "./ProxyToken";

function Tokens({ onCreateMapToken }) {
  const tokenClassName = "list-token";

  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onCreateMapToken) {
      // Give the token an id
      onCreateMapToken({ id: shortid.generate(), ...token });
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
          overflow: "auto"
        }}
        px={2}
      >
        {Object.entries(tokens).map(([id, image]) => (
          <Token key={id} image={image} className={tokenClassName} />
        ))}
      </Flex>
      <ProxyToken
        tokenClassName={tokenClassName}
        onProxyDragEnd={handleProxyDragEnd}
      />
    </>
  );
}

export default Tokens;
