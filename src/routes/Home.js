import React, { useState, useEffect, useContext } from "react";
import { Flex, Button, Image, Text } from "theme-ui";

import Footer from "../components/Footer";

import StartModal from "../modals/StartModal";
import JoinModal from "../modals/JoinModal";
import DonateModal from "../modals/DonationModal";

import AuthContext from "../contexts/AuthContext";

import owlington from "../images/Owlington.png";

function Home() {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  // Reset password on visiting home
  const { setPassword } = useContext(AuthContext);
  useEffect(() => {
    setPassword("");
  }, [setPassword]);

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
        <Button m={2} onClick={() => setIsStartModalOpen(true)}>
          Start Game
        </Button>
        <Button m={2} onClick={() => setIsJoinModalOpen(true)}>
          Join Game
        </Button>
        <Text variant="caption" as="p" sx={{ textAlign: "center" }}>
          Beta v1.4.0 (preview)
        </Text>
        <Button
          m={2}
          onClick={() => setIsDonateModalOpen(true)}
          variant="secondary"
        >
          Support Us
        </Button>
        <JoinModal
          isOpen={isJoinModalOpen}
          onRequestClose={() => setIsJoinModalOpen(false)}
        />
        <StartModal
          isOpen={isStartModalOpen}
          onRequestClose={() => setIsStartModalOpen(false)}
        />
        <DonateModal
          isOpen={isDonateModalOpen}
          onRequestClose={() => setIsDonateModalOpen(false)}
        />
      </Flex>
      <Footer />
    </Flex>
  );
}

export default Home;
