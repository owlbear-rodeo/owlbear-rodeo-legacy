import React from "react";
import { Flex, Image } from "theme-ui";

import * as tokens from "../tokens";

// import Token from "./Token";

function Tokens() {
  return (
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
        <Image
          p={2}
          key={id}
          src={image}
          sx={{ width: "64px", height: "64px" }}
        />
      ))}
    </Flex>
  );
}

export default Tokens;
