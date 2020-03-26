import React, { useState } from "react";
import { Flex, Box, Input, Text } from "theme-ui";
import { v4 as uuid } from "uuid";

import AddPartyMemberButton from "./AddPartyMemberButton";
import Message from "./Message";

import { getRandomMonster } from "../helpers/monsters";

function Party({ peerId, messages, onMessageSend }) {
  const [messageText, setMessageText] = useState("");
  const [nickname, setNickname] = useState(getRandomMonster());

  function handleMessageSubmit(event) {
    event.preventDefault();
    if (!messageText || !peerId) {
      return;
    }
    const id = uuid();
    const time = Date.now();
    const message = {
      nickname,
      id,
      text: messageText,
      time
    };
    onMessageSend(message);
    setMessageText("");
  }

  return (
    <Flex
      p={3}
      bg="background"
      sx={{
        flexDirection: "column",
        width: "256px",
        minWidth: "256px",
        overflowY: "auto",
        alignItems: "center"
      }}
    >
      <Box>
        <AddPartyMemberButton peerId={peerId} />
      </Box>
      <Flex
        p={2}
        sx={{ width: "100%" }}
        bg="muted"
        sx={{
          flexGrow: 1,
          width: "100%",
          borderRadius: "4px",
          flexDirection: "column",
          justifyContent: "flex-end"
        }}
        my={2}
      >
        {Object.values(messages)
          .sort((a, b) => a.time - b.time)
          .map(message => (
            <Message key={message.id} message={message} />
          ))}
        <Box as="form" onSubmit={handleMessageSubmit} sx={{ width: "100%" }}>
          <Input
            value={messageText}
            onChange={event => setMessageText(event.target.value)}
            p={1}
            disabled={!peerId}
          />
        </Box>
        <Text my={1} variant="caption">
          {nickname}
        </Text>
      </Flex>
    </Flex>
  );
}

export default Party;
