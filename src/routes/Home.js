import React, { useState, useEffect, useContext } from "react";
import { Flex, Button, Image, Text, IconButton, Link } from "theme-ui";
import { useHistory } from "react-router-dom";

import Footer from "../components/Footer";

import StartModal from "../modals/StartModal";
import JoinModal from "../modals/JoinModal";

import AuthContext from "../contexts/AuthContext";

import RedditIcon from "../icons/SocialRedditIcon";
import TwitterIcon from "../icons/SocialTwitterIcon";
import YouTubeIcon from "../icons/SocialYouTubeIcon";
import DonateIcon from "../icons/DonateIcon";
import PatreonIcon from "../icons/SocialPatreonIcon";

import owlington from "../images/Owlington.png";

function Home() {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Reset password on visiting home
  const { setPassword } = useContext(AuthContext);
  useEffect(() => {
    setPassword("");
  }, [setPassword]);

  const history = useHistory();

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
          Beta v{process.env.REACT_APP_VERSION}
        </Text>
        <Button
          as="a"
          href="https://patreon.com/owlbearrodeo"
          mt={4}
          mx={2}
          mb={2}
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          Patreon <PatreonIcon />
        </Button>
        <Button
          as="a"
          href="/donate"
          mt={2}
          mb={4}
          mx={2}
          onClick={(e) => {
            e.preventDefault();
            history.push("/donate");
          }}
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          Donate <DonateIcon />
        </Button>
        <Flex mb={4} mt={0} sx={{ justifyContent: "center" }}>
          <Link href="https://www.reddit.com/r/OwlbearRodeo/">
            <IconButton title="Reddit" aria-label="Reddit">
              <RedditIcon />
            </IconButton>
          </Link>
          <Link href="https://twitter.com/OwlbearRodeo">
            <IconButton title="Twitter" aria-label="Twitter">
              <TwitterIcon />
            </IconButton>
          </Link>
          <Link href="https://www.youtube.com/channel/UCePe1wJC53_7fbBbSECG7YQ">
            <IconButton title="YouTube" aria-label="YouTube">
              <YouTubeIcon />
            </IconButton>
          </Link>
        </Flex>
        <JoinModal
          isOpen={isJoinModalOpen}
          onRequestClose={() => setIsJoinModalOpen(false)}
        />
        <StartModal
          isOpen={isStartModalOpen}
          onRequestClose={() => setIsStartModalOpen(false)}
        />
      </Flex>
      <Footer />
    </Flex>
  );
}

export default Home;
