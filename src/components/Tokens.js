import React from "react";
import { Flex } from "theme-ui";
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
          <Token key={id} image={image} className={listTokenClassName} />
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
