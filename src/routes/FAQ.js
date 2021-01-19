import React from "react";
import { Flex, Text } from "theme-ui";
import raw from "raw.macro";

import Footer from "../components/Footer";
import Markdown from "../components/Markdown";

import assets from "../docs/assets";

const database = raw("../docs/faq/database.md");
const maps = raw("../docs/faq/maps.md");
const audioSharing = raw("../docs/faq/audio-sharing.md");

function FAQ() {
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
          maxWidth: "500px",
          flexGrow: 1,
        }}
        m={4}
      >
        <Text mb={2} variant="heading" as="h1" sx={{ fontSize: 5 }}>
          Frequently Asked Questions
        </Text>
        <div id="database">
          <Markdown source={database} assets={assets} />
        </div>
        <div id="maps">
          <Markdown source={maps} assets={assets} />
        </div>
        <div id="audio-sharing">
          <Markdown source={audioSharing} assets={assets} />
        </div>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default FAQ;
