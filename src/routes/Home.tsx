import { useState, useEffect } from "react";
import { Flex, Button, Image, Text, IconButton, Link } from "theme-ui";

import Footer from "../components/Footer";

import StartModal from "../modals/StartModal";
import JoinModal from "../modals/JoinModal";
import GettingStartedModal from "../modals/GettingStartedModal";

import HelpIcon from "../icons/HelpIcon";

import { useAuth } from "../contexts/AuthContext";

import RedditIcon from "../icons/SocialRedditIcon";
import TwitterIcon from "../icons/SocialTwitterIcon";
import YouTubeIcon from "../icons/SocialYouTubeIcon";
import SocialPatreonIcon from "../icons/SocialPatreonIcon";

import owlington from "../images/Owlington.png";

function Home() {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isGettingStartedModalOpen, setIsGettingStartedModalOpen] =
    useState(false);

  // Reset password on visiting home
  const { setPassword } = useAuth();
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
        <Button
          variant="secondary"
          m={2}
          onClick={() => setIsGettingStartedModalOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Getting Started <HelpIcon />
        </Button>
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
          // @ts-ignore
          href="https://owlbear.app/"
          mt={4}
          mx={2}
          mb={2}
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          Owlbear Rodeo 2.0 Beta
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
          <Link href="https://patreon.com/owlbearrodeo">
            <IconButton title="Patreon" aria-label="Patreon">
              <SocialPatreonIcon />
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
        <GettingStartedModal
          isOpen={isGettingStartedModalOpen}
          onRequestClose={() => setIsGettingStartedModalOpen(false)}
        />
      </Flex>
      <Footer />
    </Flex>
  );
}

export default Home;
