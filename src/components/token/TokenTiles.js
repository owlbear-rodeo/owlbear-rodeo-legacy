import React from "react";
import { Flex } from "theme-ui";
import SimpleBar from "simplebar-react";

import AddIcon from "../../icons/AddIcon";

import TokenTile from "./TokenTile";

function TokenTiles({ tokens, onTokenAdd }) {
  return (
    <SimpleBar style={{ maxHeight: "300px", width: "500px" }}>
      <Flex
        py={2}
        bg="muted"
        sx={{
          flexWrap: "wrap",
          width: "500px",
          borderRadius: "4px",
        }}
      >
        <Flex
          onClick={onTokenAdd}
          sx={{
            ":hover": {
              color: "primary",
            },
            ":focus": {
              outline: "none",
            },
            ":active": {
              color: "secondary",
            },
            width: "150px",
            height: "150px",
            borderRadius: "4px",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
          m={2}
          bg="muted"
          aria-label="Add Token"
          title="Add Token"
        >
          <AddIcon large />
        </Flex>
        {tokens.map((token) => (
          <TokenTile key={token.id} token={token} />
        ))}
      </Flex>
    </SimpleBar>
  );
}

export default TokenTiles;
