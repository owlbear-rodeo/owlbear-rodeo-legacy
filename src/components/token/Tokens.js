import React, { useContext } from "react";
import { Box, Flex } from "theme-ui";
import shortid from "shortid";
import SimpleBar from "simplebar-react";

import ListToken from "./ListToken";
import ProxyToken from "./ProxyToken";

import SelectTokensButton from "./SelectTokensButton";

import { fromEntries } from "../../helpers/shared";

import AuthContext from "../../contexts/AuthContext";
import TokenDataContext from "../../contexts/TokenDataContext";

const listTokenClassName = "list-token";

function Tokens({ onMapTokenStateCreate }) {
  const { userId } = useContext(AuthContext);
  const { ownedTokens, tokens } = useContext(TokenDataContext);

  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onMapTokenStateCreate) {
      // Create a token state from the dragged token
      onMapTokenStateCreate({
        id: shortid.generate(),
        tokenId: token.id,
        owner: userId,
        size: token.defaultSize,
        label: "",
        statuses: [],
        x: token.x,
        y: token.y,
        lastEditedBy: userId,
        rotation: 0,
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
            .filter((token) => !token.hideInSidebar)
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
