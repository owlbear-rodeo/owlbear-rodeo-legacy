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
        <Text my={1} variant="heading" as="h2" sx={{ fontSize: 3 }}>
          Connection Failed
        </Text>
        <Text my={1} variant="heading" as="h3">
          Ice connection failed / Connection failed.
        </Text>
        <Text mb={2} variant="body2" as="p">
          Owlbear Rodeo uses peer to peer connections to send data between the
          players. Specifically the{" "}
          <Link href="https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API">
            WebRTC API
          </Link>{" "}
          is used. WebRTC allows the sending of two types of data, the first is
          media such as a camera or microphone and the second is raw data such
          as chat messages or in this case the state of the game map. <br /> As
          at this time we don't support voice or video chat as such we only use
          the raw data feature of WebRTC. This however can lead to connection
          issues, specifically with the Safari web browser and connecting
          between two devices on the same network. This is due a decision made
          by the Safari team to only allow fully peer to peer connections when
          the user grants camera permission to the website. Unfortunately that
          means in order to fully support Safari we would need to ask for camera
          permission even though we wouldn't be using it. To us that is a bad
          user experience so we have decided against it at this time. <br />
          The good news is that Safari will still work if the two devices are
          connected to a seperate network as we make use of{" "}
          <Link href="https://en.wikipedia.org/wiki/Traversal_Using_Relays_around_NAT">
            TURN
          </Link>{" "}
          servers which will handle the IP sharing and are not blocked by
          Safari.{" "}
          <strong>
            So if you're seeing errors and are on the same network as the other
            person if possible switch to seperate networks and try again.
          </strong>
          . For more information about Safari's restrictions on WebRTC see this{" "}
          <Link href="https://bugs.webkit.org/show_bug.cgi?id=173052">
            bug report
          </Link>{" "}
          on the Webkit site or this{" "}
          <Link href="https://webkit.org/blog/7763/a-closer-look-into-webrtc/">
            blog post
          </Link>
          .
        </Text>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default FAQ;
