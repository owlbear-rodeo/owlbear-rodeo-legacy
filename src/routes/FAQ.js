import React from "react";
import { Flex, Text } from "theme-ui";
import raw from "raw.macro";

import Footer from "../components/Footer";
import Markdown from "../components/Markdown";

import assets from "../docs/assets";

const connection = raw("../docs/faq/connection.md");
const radio = raw("../docs/faq/radio.md");
const saving = raw("../docs/faq/saving.md");

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
        <div id="connection">
          <Markdown source={connection} assets={assets} />
        </div>
        <div id="radio">
          <Markdown source={radio} assets={assets} />
        </div>
        <div id="saving">
          <Markdown source={saving} assets={assets} />
        </div>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default FAQ;
