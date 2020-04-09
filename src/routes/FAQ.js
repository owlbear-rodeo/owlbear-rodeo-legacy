import React from "react";
import { Flex, Text, Link, Image } from "theme-ui";

import Footer from "../components/Footer";

import audioSharingImage from "../images/AudioSharingFAQ.png";

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
        my={2}
      >
        <Text mb={2} variant="heading" as="h1" sx={{ fontSize: 5 }}>
          Frequently Asked Questions
        </Text>
        <Text my={1} variant="heading" as="h2" sx={{ fontSize: 3 }}>
          Using Radio (experimental)
        </Text>
        <Text my={1} variant="heading" as="h3">
          No audio found in screen share.
        </Text>
        <Text variant="body2" as="p">
          When using audio sharing you must select the{" "}
          <strong>Share audio</strong> option when choosing the browser tab or
          screen to share. Support for sharing audio depends on browser and
          operating system. Currently Google Chrome on Windows allows you to
          share the audio of any tab or an entire screen while on MacOS you can
          only share the audio of a tab. For an example of selecting the{" "}
          <strong>Share audio</strong> option for a tab on MacOS see Figure 1.
        </Text>
        <Image mt={2} src={audioSharingImage} sx={{ borderRadius: "4px" }} />
        <Text my={1} variant="caption" as="p">
          <strong>Figure 1 Using Audio Sharing.</strong> First select what type
          of content you would like to share. Second select the content. Third
          select Share audio. Fourth select Share.
        </Text>

        <Text my={1} variant="heading" as="h3">
          Browser not supported for audio sharing.
        </Text>
        <Text mb={2} variant="body2" as="p">
          Using audio sharing relies on the browser supporting the audio capture
          feature of the Screen Capture API. Currently the two browsers that
          support this are Google Chrome and Microsoft Edge. To see if your
          browser is supported see the{" "}
          <Link href="https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia#Browser_compatibility">
            Browser Compatibility chart
          </Link>{" "}
          on the Mozilla Developer Network.
        </Text>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default FAQ;
