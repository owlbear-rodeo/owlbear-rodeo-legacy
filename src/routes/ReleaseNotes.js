import React from "react";
import { Flex, Text } from "theme-ui";
import raw from "raw.macro";

import Footer from "../components/Footer";
import Markdown from "../components/Markdown";

const v110 = raw("../docs/releaseNotes/v1.1.0.md");
const v120 = raw("../docs/releaseNotes/v1.2.0.md");
const v121 = raw("../docs/releaseNotes/v1.2.1.md");
const v130 = raw("../docs/releaseNotes/v1.3.0.md");
const v131 = raw("../docs/releaseNotes/v1.3.1.md");
const v132 = raw("../docs/releaseNotes/v1.3.2.md");
const v133 = raw("../docs/releaseNotes/v1.3.3.md");
const v140 = raw("../docs/releaseNotes/v1.4.0.md");

function ReleaseNotes() {
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
          Release Notes
        </Text>
        <div id="v140">
          <Markdown source={v140} />
        </div>
        <div id="v133">
          <Markdown source={v133} />
        </div>
        <div id="v132">
          <Markdown source={v132} />
        </div>
        <div id="v131">
          <Markdown source={v131} />
        </div>
        <div id="v130">
          <Markdown source={v130} />
        </div>
        <div id="v121">
          <Markdown source={v121} />
        </div>
        <div id="v120">
          <Markdown source={v120} />
        </div>
        <div id="v110">
          <Markdown source={v110} />
        </div>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default ReleaseNotes;
