import React from "react";

import { Flex } from "theme-ui";

import PartyVideo from "./PartyVideo";

function Party({ streams, localStreamId }) {
  return (
    <Flex
      p={3}
      bg="background"
      sx={{ flexDirection: "column", width: "192px", minWidth: "192px" }}
    >
      {Object.entries(streams).map(([id, stream]) => (
        <PartyVideo key={id} stream={stream} muted={id === localStreamId} />
      ))}
    </Flex>
  );
}

export default Party;
