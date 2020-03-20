import React from "react";

import { Flex } from "theme-ui";

import PartyVideo from "./PartyVideo";
import AddPartyMemberButton from "./AddPartyMemberButton";

function Party({ streams, localStreamId }) {
  return (
    <Flex
      p={3}
      bg="background"
      sx={{
        flexDirection: "column",
        width: "192px",
        minWidth: "192px",
        overflowY: "auto"
      }}
    >
      {Object.entries(streams).map(([id, stream]) => (
        <PartyVideo key={id} stream={stream} muted={id === localStreamId} />
      ))}
      <AddPartyMemberButton streamId={localStreamId} />
    </Flex>
  );
}

export default Party;
