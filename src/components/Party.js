import React from "react";

import { Flex } from "theme-ui";

import PartyVideo from "./PartyVideo";

function Party({ streams }) {
  return (
    <Flex p={4} bg="highlight" sx={{ flexDirection: "column", width: "200px" }}>
      {Object.entries(streams).map(([id, stream]) => (
        <PartyVideo key={id} stream={stream} />
      ))}
    </Flex>
  );
}

export default Party;
