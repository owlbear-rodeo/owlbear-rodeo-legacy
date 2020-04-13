import React, { useState } from "react";
import { Flex, Button, Image, Text } from "theme-ui";
import shortid from "shortid";
import { useHistory } from "react-router-dom";

import Footer from "../components/Footer";

import JoinModal from "../modals/JoinModal";

import owlington from "../images/Owlington.png";

function Home() {
  let history = useHistory();
  function handleStartGame() {
    history.push(`/game/${shortid.generate()}`);
  }

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <Flex
      sx={{
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100%",
        alignItems: "center",
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "300px",
          flexGrow: 1,
        }}
        mb={2}
      >
        <Text variant="display" as="h1" sx={{ textAlign: "center" }}>
          Owlbear Rodeo
        </Text>
        <Image src={owlington} m={2} />
        <Button m={2} onClick={handleStartGame}>
          Start Game
        </Button>
        <Button m={2} onClick={() => setIsJoinModalOpen(true)}>
          Join Game
        </Button>
        <Text variant="caption" as="p" sx={{ textAlign: "center" }}>
          Alpha v0.9.1
        </Text>
        <JoinModal
          isOpen={isJoinModalOpen}
          onRequestClose={() => setIsJoinModalOpen(false)}
        />
      </Flex>
      <Footer />
    </Flex>
  );
}

export default Home;
