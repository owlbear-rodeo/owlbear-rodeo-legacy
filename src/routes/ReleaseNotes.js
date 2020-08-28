import React from "react";
import { Flex, Text } from "theme-ui";
import raw from "raw.macro";

import Footer from "../components/Footer";
import Markdown from "../components/Markdown";
import Accordion from "../components/Accordion";

const v110 = raw("../docs/releaseNotes/v1.1.0.md");
const v120 = raw("../docs/releaseNotes/v1.2.0.md");
const v121 = raw("../docs/releaseNotes/v1.2.1.md");
const v130 = raw("../docs/releaseNotes/v1.3.0.md");
const v131 = raw("../docs/releaseNotes/v1.3.1.md");
const v132 = raw("../docs/releaseNotes/v1.3.2.md");
const v133 = raw("../docs/releaseNotes/v1.3.3.md");
const v140 = raw("../docs/releaseNotes/v1.4.0.md");
const v141 = raw("../docs/releaseNotes/v1.4.1.md");
const v142 = raw("../docs/releaseNotes/v1.4.2.md");
const v150 = raw("../docs/releaseNotes/v1.5.0.md");
const v151 = raw("../docs/releaseNotes/v1.5.1.md");

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
          maxWidth: "564px",
          flexGrow: 1,
          width: "100%",
        }}
        p={4}
      >
        <Text mb={2} variant="heading" as="h1" sx={{ fontSize: 5 }}>
          Release Notes
        </Text>
        <div id="v151">
          <Accordion heading="v1.5.1" defaultOpen>
            <Markdown source={v151} />
          </Accordion>
        </div>
        <div id="v150">
          <Accordion heading="v1.5.0" defaultOpen>
            <Markdown source={v150} />
          </Accordion>
        </div>
        <div id="v142">
          <Accordion heading="v1.4.2">
            <Markdown source={v142} />
          </Accordion>
        </div>
        <div id="v141">
          <Accordion heading="v1.4.1">
            <Markdown source={v141} />
          </Accordion>
        </div>
        <div id="v140">
          <Accordion heading="v1.4.0">
            <Markdown source={v140} />
          </Accordion>
        </div>
        <div id="v133">
          <Accordion heading="v1.3.3">
            <Markdown source={v133} />
          </Accordion>
        </div>
        <div id="v132">
          <Accordion heading="v1.3.2">
            <Markdown source={v132} />
          </Accordion>
        </div>
        <div id="v131">
          <Accordion heading="v1.3.1">
            <Markdown source={v131} />
          </Accordion>
        </div>
        <div id="v130">
          <Accordion heading="v1.3.0">
            <Markdown source={v130} />
          </Accordion>
        </div>
        <div id="v121">
          <Accordion heading="v1.2.1">
            <Markdown source={v121} />
          </Accordion>
        </div>
        <div id="v120">
          <Accordion heading="v1.2.0">
            <Markdown source={v120} />
          </Accordion>
        </div>
        <div id="v110">
          <Accordion heading="v1.1.0">
            <Markdown source={v110} />
          </Accordion>
        </div>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default ReleaseNotes;
