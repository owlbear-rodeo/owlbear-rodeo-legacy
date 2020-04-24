import React, { useState, useEffect } from "react";
import { Box } from "theme-ui";
import shortid from "shortid";
import SimpleBar from "simplebar-react";

import { tokens as defaultTokens } from "../../tokens";

import ListToken from "./ListToken";
import ProxyToken from "./ProxyToken";
import NumberInput from "../NumberInput";

import { fromEntries } from "../../helpers/shared";

const listTokenClassName = "list-token";

function Tokens({ onCreateMapToken }) {
  const [tokens, setTokens] = useState([]);
  useEffect(() => {
    const defaultTokensWithIds = [];
    for (let defaultToken of defaultTokens) {
      defaultTokensWithIds.push({ ...defaultToken, id: defaultToken.name });
    }
    setTokens(defaultTokensWithIds);
  }, []);

  const [tokenSize, setTokenSize] = useState(1);

  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onCreateMapToken) {
      // Give the token an id
      onCreateMapToken({
        ...token,
        id: shortid.generate(),
        size: tokenSize,
        label: "",
        statuses: [],
      });
    }
  }

  return (
    <>
      <Box
        sx={{
          height: "100%",
          width: "80px",
          minWidth: "80px",
          overflow: "hidden",
        }}
      >
        <SimpleBar style={{ height: "calc(100% - 58px)", overflowX: "hidden" }}>
          {tokens.map((token) => (
            <ListToken
              key={token.id}
              token={token}
              className={listTokenClassName}
            />
          ))}
        </SimpleBar>
        <Box pt={1} bg="muted" sx={{ height: "58px" }}>
          <NumberInput
            value={tokenSize}
            onChange={setTokenSize}
            title="Size"
            min={1}
            max={9}
          />
        </Box>
      </Box>
      <ProxyToken
        tokenClassName={listTokenClassName}
        onProxyDragEnd={handleProxyDragEnd}
        tokens={fromEntries(tokens.map((token) => [token.id, token]))}
      />
    </>
  );
}

export default Tokens;
