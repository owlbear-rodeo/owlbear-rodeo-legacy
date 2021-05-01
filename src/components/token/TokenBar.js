import React from "react";
import { Box, Flex } from "theme-ui";
import shortid from "shortid";
import SimpleBar from "simplebar-react";

import ListToken from "./ListToken";
import ProxyToken from "./ProxyToken";

import SelectTokensButton from "./SelectTokensButton";

import { fromEntries } from "../../helpers/shared";

import useSetting from "../../hooks/useSetting";

import { useAuth } from "../../contexts/AuthContext";
import { useTokenData } from "../../contexts/TokenDataContext";

const listTokenClassName = "list-token";

function TokenBar({ onMapTokenStateCreate }) {
  const { userId } = useAuth();
  const { ownedTokens, tokens } = useTokenData();
  const [fullScreen] = useSetting("map.fullScreen");

  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onMapTokenStateCreate) {
      // Create a token state from the dragged token
      let tokenState = {
        id: shortid.generate(),
        tokenId: token.id,
        owner: userId,
        size: token.defaultSize,
        category: token.defaultCategory,
        label: token.defaultLabel,
        statuses: [],
        x: token.x,
        y: token.y,
        lastModifiedBy: userId,
        lastModified: Date.now(),
        rotation: 0,
        locked: false,
        visible: true,
        type: token.type,
        outline: token.outline,
        width: token.width,
        height: token.height,
      };
      if (token.type === "file") {
        tokenState.file = token.file;
      } else if (token.type === "default") {
        tokenState.key = token.key;
      }
      onMapTokenStateCreate(tokenState);
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
          display: fullScreen ? "none" : "block",
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

export default TokenBar;
