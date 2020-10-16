import React from "react";
import { Flex, Text, Link as ExternalLink } from "theme-ui";

import Footer from "../components/Footer";

function About() {
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
          maxWidth: "350px",
          flexGrow: 1,
        }}
        m={4}
      >
        <Text my={2} variant="heading" as="h1" sx={{ fontSize: 5 }}>
          About <span aria-hidden="true">ʕ•ᴥ•ʔ</span>
        </Text>
        <Text my={1} mt={2} variant="heading" as="h3" sx={{ fontSize: 3 }}>
          The Goal
        </Text>
        <Text variant="body2" as="p">
          Owlbear Rodeo is an attempt to make a web app to run tabletop
          encounters without the complicated setup process needed for other
          VTTs.
        </Text>
        <Text my={1} mt={2} variant="heading" as="h3" sx={{ fontSize: 3 }}>
          The People
        </Text>
        <Text variant="body2" as="p">
          Made by two people in Melbourne, Australia.{" "}
          <ExternalLink href="https://mitchmccaffrey.com/">Mitch</ExternalLink>{" "}
          and{" "}
          <ExternalLink href="https://twitter.com/nthouliss">
            Nicola
          </ExternalLink>{" "}
          were looking for an easy way to continue their d{"&"}d campaign as
          in-person interaction becomes harder during the COVID-19 crisis.
        </Text>
        <Text my={1} mt={2} variant="heading" as="h3" sx={{ fontSize: 3 }}>
          Contact
        </Text>
        <Text variant="body2" as="p">
          For questions or feedback email{" "}
          <ExternalLink href="mailto:contact@owlbear.rodeo">
            contact@owlbear.rodeo
          </ExternalLink>
        </Text>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default About;
