import React from "react";

import { Flex, Box } from "theme-ui";

import PartyVideo from "./PartyVideo";
import AddPartyMemberButton from "./AddPartyMemberButton";
import GameViewSwitch from "./GameViewSwitch";

function Party({ streams, localStreamId, view, onViewChange }) {
  if (view === "social") {
    return (
      <Flex
        sx={{
          flexDirection: "column",
          width: "100%",
          alignItems: "center",
          overflowY: "auto"
        }}
      >
        <Flex
          p={3}
          bg="background"
          sx={{
            flexDirection: "row",
            width: "100%",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {Object.entries(streams).map(([id, stream]) => (
            <Box key={id} m={2}>
              <PartyVideo stream={stream} muted={id === localStreamId} />
            </Box>
          ))}
        </Flex>
        <Box sx={{ flexGrow: 1 }}>
          <AddPartyMemberButton streamId={localStreamId} />
        </Box>
        <Flex my={2}>
          <GameViewSwitch view={view} onViewChange={onViewChange} />
        </Flex>
      </Flex>
    );
  } else if (view === "encounter") {
    return (
      <Flex
        p={3}
        bg="background"
        sx={{
          flexDirection: "column",
          width: "192px",
          minWidth: "192px",
          overflowY: "auto",
          alignItems: "center"
        }}
      >
        {Object.entries(streams).map(([id, stream]) => (
          <Box key={id} my={1}>
            <PartyVideo stream={stream} muted={id === localStreamId} />
          </Box>
        ))}
        <Box sx={{ flexGrow: 1 }}>
          <AddPartyMemberButton streamId={localStreamId} />
        </Box>
        <Flex my={1}>
          <GameViewSwitch view={view} onViewChange={onViewChange} />
        </Flex>
      </Flex>
    );
  }

  return null;
}

Party.defaultProps = { view: "social" };

export default Party;
