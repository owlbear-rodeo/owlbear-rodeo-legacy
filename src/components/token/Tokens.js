import React, { useState, useContext } from "react";
import { Box } from "theme-ui";
import shortid from "shortid";
import SimpleBar from "simplebar-react";

import ListToken from "./ListToken";
import ProxyToken from "./ProxyToken";
import NumberInput from "../NumberInput";

import { fromEntries } from "../../helpers/shared";

import AuthContext from "../../contexts/AuthContext";

const listTokenClassName = "list-token";

function Tokens({ onCreateMapTokenState, tokens }) {
  const [tokenSize, setTokenSize] = useState(1);
  const { userId } = useContext(AuthContext);

  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onCreateMapTokenState) {
      // Create a token state from the dragged token
      onCreateMapTokenState({
        id: shortid.generate(),
        tokenId: token.id,
        type: token.type,
        owner: userId,
        size: tokenSize,
        label: "",
        statuses: [],
        x: token.x,
        y: token.y,
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
