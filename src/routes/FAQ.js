import React from "react";
import { Flex, Text, Box } from "theme-ui";
import raw from "raw.macro";

import Footer from "../components/Footer";
import Markdown from "../components/Markdown";

import assets from "../docs/assets";

const database = raw("../docs/faq/database.md");
const maps = raw("../docs/faq/maps.md");
const audioSharing = raw("../docs/faq/audio-sharing.md");
const general = raw("../docs/faq/general.md");
const connection = raw("../docs/faq/connection.md");

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
        <Box my={1} id="general">
          <Markdown source={general} assets={assets} />
        </Box>
        <Box my={1} id="maps">
          <Markdown source={maps} assets={assets} />
        </Box>
        <Box my={1} id="audio-sharing">
          <Markdown source={audioSharing} assets={assets} />
        </Box>
        <Box my={1} id="database">
          <Markdown source={database} assets={assets} />
        </Box>
        <Box my={1} id="connection">
          <Markdown source={connection} assets={assets} />
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default FAQ;
