import React, { useState, useContext } from "react";
import { Box, Flex } from "theme-ui";
import shortid from "shortid";
import SimpleBar from "simplebar-react";

import ListToken from "./ListToken";
import ProxyToken from "./ProxyToken";
import NumberInput from "../NumberInput";

import SelectTokensButton from "./SelectTokensButton";

import { fromEntries } from "../../helpers/shared";

import AuthContext from "../../contexts/AuthContext";
import TokenDataContext from "../../contexts/TokenDataContext";

const listTokenClassName = "list-token";

function Tokens({ onMapTokenStateCreate }) {
  const { userId } = useContext(AuthContext);
  const { ownedTokens, tokens } = useContext(TokenDataContext);

  const [tokenSize, setTokenSize] = useState(1);

  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onMapTokenStateCreate) {
      // Create a token state from the dragged token
      onMapTokenStateCreate({
        id: shortid.generate(),
        tokenId: token.id,
        tokenType: token.type,
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
        <SimpleBar style={{ height: "calc(100% - 48px)", overflowX: "hidden" }}>
          {ownedTokens
            .filter((token) => token.owner === userId)
            .map((token) => (
              <ListToken
                key={token.id}
                token={token}
                className={listTokenClassName}
              />
            ))}
        </SimpleBar>
        <Flex
          bg="muted"
          sx={{
            justifyContent: "center",
            height: "48px",
            alignItems: "center",
          }}
        >
          <SelectTokensButton />
          {/* <NumberInput
            value={tokenSize}
            onChange={setTokenSize}
            title="Size"
            min={1}
            max={9}
          /> */}
        </Flex>
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
