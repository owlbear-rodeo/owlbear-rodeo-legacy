import React from "react";
import { Flex, Text } from "theme-ui";
import raw from "raw.macro";
import { useLocation } from "react-router-dom";

import Footer from "../components/Footer";
import Markdown from "../components/Markdown";
import Accordion from "../components/Accordion";

import assets from "../docs/assets";

const overview = raw("../docs/howTo/overview.md");
const startingAndJoining = raw("../docs/howTo/startingAndJoining.md");
const sharingMaps = raw("../docs/howTo/sharingMaps.md");
const usingTokens = raw("../docs/howTo/usingTokens.md");
const usingDrawing = raw("../docs/howTo/usingDrawing.md");
const usingDice = raw("../docs/howTo/usingDice.md");
const usingFog = raw("../docs/howTo/usingFog.md");
const usingMeasure = raw("../docs/howTo/usingMeasure.md");
const sharingAudio = raw("../docs/howTo/sharingAudio.md");

function HowTo() {
  const location = useLocation();
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
          maxWidth: "564px",
          flexGrow: 1,
          width: "100%",
        }}
        p={4}
      >
        <Text mb={2} variant="heading" as="h1" sx={{ fontSize: 5 }}>
          How To
        </Text>
        <div id="overview">
          <Markdown source={overview} assets={assets} />
        </div>
        <div id="startingAndJoining">
          <Accordion
            heading="Starting and Joining a Game"
            defaultOpen={location.hash === "#startingAndJoining"}
          >
            <Markdown source={startingAndJoining} assets={assets} />
          </Accordion>
        </div>
        <div id="sharingMaps">
          <Accordion
            heading="Sharing a Map"
            defaultOpen={location.hash === "#sharingMaps"}
          >
            <Markdown source={sharingMaps} assets={assets} />
          </Accordion>
        </div>
        <div id="usingTokens">
          <Accordion
            heading="Using Tokens"
            defaultOpen={location.hash === "#usingTokens"}
          >
            <Markdown source={usingTokens} assets={assets} />
          </Accordion>
        </div>
        <div id="usingDrawing">
          <Accordion
            heading="Using the Drawing Tool"
            defaultOpen={location.hash === "#usingDrawing"}
          >
            <Markdown source={usingDrawing} assets={assets} />
          </Accordion>
        </div>
        <div id="usingDice">
          <Accordion
            heading="Using Dice"
            defaultOpen={location.hash === "#usingDice"}
          >
            <Markdown source={usingDice} assets={assets} />
          </Accordion>
        </div>
        <div id="usingFog">
          <Accordion
            heading="Using the Fog Tool"
            defaultOpen={location.hash === "#usingFog"}
          >
            <Markdown source={usingFog} assets={assets} />
          </Accordion>
        </div>
        <div id="usingMeasure">
          <Accordion
            heading="Using the Measure Tool"
            defaultOpen={location.hash === "#usingMeasure"}
          >
            <Markdown source={usingMeasure} assets={assets} />
          </Accordion>
        </div>
        <div id="sharingAudio">
          <Accordion
            heading="Sharing Audio (Experimental)"
            defaultOpen={location.hash === "#sharingAudio"}
          >
            <Markdown source={sharingAudio} assets={assets} />
          </Accordion>
        </div>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default HowTo;
