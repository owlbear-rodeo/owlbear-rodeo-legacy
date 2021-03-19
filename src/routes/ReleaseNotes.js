import React from "react";
import { Flex, Text } from "theme-ui";
import raw from "raw.macro";
import { useLocation } from "react-router-dom";

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
const v152 = raw("../docs/releaseNotes/v1.5.2.md");
const v160 = raw("../docs/releaseNotes/v1.6.0.md");
const v161 = raw("../docs/releaseNotes/v1.6.1.md");
const v162 = raw("../docs/releaseNotes/v1.6.2.md");
const v170 = raw("../docs/releaseNotes/v1.7.0.md");
const v180 = raw("../docs/releaseNotes/v1.8.0.md");
const v181 = raw("../docs/releaseNotes/v1.8.1.md");

function ReleaseNotes() {
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
          Release Notes
        </Text>
        <div id="v181">
          <Accordion heading="v1.8.1" defaultOpen>
            <Markdown source={v181} />
          </Accordion>
        </div>
        <div id="v180">
          <Accordion heading="v1.8.0" defaultOpen>
            <Markdown source={v180} />
          </Accordion>
        </div>
        <div id="v170">
          <Accordion heading="v1.7.0" defaultOpen={location.hash === "#v170"}>
            <Markdown source={v170} />
          </Accordion>
        </div>
        <div id="v162">
          <Accordion heading="v1.6.2" defaultOpen={location.hash === "#v162"}>
            <Markdown source={v162} />
          </Accordion>
        </div>
        <div id="v161">
          <Accordion heading="v1.6.1" defaultOpen={location.hash === "#v161"}>
            <Markdown source={v161} />
          </Accordion>
        </div>
        <div id="v160">
          <Accordion heading="v1.6.0" defaultOpen={location.hash === "#v160"}>
            <Markdown source={v160} />
          </Accordion>
        </div>
        <div id="v152">
          <Accordion heading="v1.5.2" defaultOpen={location.hash === "#v152"}>
            <Markdown source={v152} />
          </Accordion>
        </div>
        <div id="v151">
          <Accordion heading="v1.5.1" defaultOpen={location.hash === "#v151"}>
            <Markdown source={v151} />
          </Accordion>
        </div>
        <div id="v150">
          <Accordion heading="v1.5.0" defaultOpen={location.hash === "#v150"}>
            <Markdown source={v150} />
          </Accordion>
        </div>
        <div id="v142">
          <Accordion heading="v1.4.2" defaultOpen={location.hash === "#v142"}>
            <Markdown source={v142} />
          </Accordion>
        </div>
        <div id="v141">
          <Accordion heading="v1.4.1" defaultOpen={location.hash === "#v141"}>
            <Markdown source={v141} />
          </Accordion>
        </div>
        <div id="v140">
          <Accordion heading="v1.4.0" defaultOpen={location.hash === "#v140"}>
            <Markdown source={v140} />
          </Accordion>
        </div>
        <div id="v133">
          <Accordion heading="v1.3.3" defaultOpen={location.hash === "#v133"}>
            <Markdown source={v133} />
          </Accordion>
        </div>
        <div id="v132">
          <Accordion heading="v1.3.2" defaultOpen={location.hash === "#v132"}>
            <Markdown source={v132} />
          </Accordion>
        </div>
        <div id="v131">
          <Accordion heading="v1.3.1" defaultOpen={location.hash === "#v131"}>
            <Markdown source={v131} />
          </Accordion>
        </div>
        <div id="v130">
          <Accordion heading="v1.3.0" defaultOpen={location.hash === "#v130"}>
            <Markdown source={v130} />
          </Accordion>
        </div>
        <div id="v121">
          <Accordion heading="v1.2.1" defaultOpen={location.hash === "#v121"}>
            <Markdown source={v121} />
          </Accordion>
        </div>
        <div id="v120">
          <Accordion heading="v1.2.0" defaultOpen={location.hash === "#v120"}>
            <Markdown source={v120} />
          </Accordion>
        </div>
        <div id="v110">
          <Accordion heading="v1.1.0" defaultOpen={location.hash === "#v110"}>
            <Markdown source={v110} />
          </Accordion>
        </div>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default ReleaseNotes;
