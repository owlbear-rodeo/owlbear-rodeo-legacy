import React, { useState } from "react";
import { Box } from "theme-ui";
import shortid from "shortid";
import SimpleBar from "simplebar-react";

import * as tokens from "../tokens";

import ListToken from "./ListToken";
import ProxyToken from "./ProxyToken";
import NumberInput from "./NumberInput";

const listTokenClassName = "list-token";

function Tokens({ onCreateMapToken }) {
  const [tokenSize, setTokenSize] = useState(1);

  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onCreateMapToken) {
      // Give the token an id
      onCreateMapToken({
        ...token,
        id: shortid.generate(),
        size: tokenSize,
        label: "",
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
          {Object.entries(tokens).map(([id, image]) => (
            <Box key={id} my={2} mx={3} sx={{ width: "48px", height: "48px" }}>
              <ListToken image={image} className={listTokenClassName} />
            </Box>
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
      />
    </>
  );
}

export default Tokens;
