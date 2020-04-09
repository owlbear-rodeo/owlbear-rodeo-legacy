import React from "react";
import { Flex, Text, Link } from "theme-ui";

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
          maxWidth: "300px",
          flexGrow: 1,
        }}
        mb={2}
      >
        <Text my={2} variant="heading" as="h1" sx={{ fontSize: 5 }}>
          About
        </Text>
        <Text my={1} mt={2} variant="heading" as="h3">
          The Goal
        </Text>
        <Text variant="body2" as="p">
          Owlbear Rodeo is an attempt to make a web app to run tabletop
          encounters without the complicated setup process needed for other
          VTTs.
        </Text>
        <Text my={1} mt={2} variant="heading" as="h3">
          The People
        </Text>
        <Text variant="body2" as="p">
          Made by two people in Melbourne, Australia.{" "}
          <Link href="https://mitchmccaffrey.com/">Mitch</Link> and{" "}
          <Link href="https://twitter.com/nthouliss">Nicola</Link> were looking
          for an easy way to continue their d{"&"}d campaign as in person
          interaction becomes harder.
        </Text>
        <Text my={1} mt={2} variant="heading" as="h3">
          Contact
        </Text>
        <Text variant="body2" as="p">
          For questions or feedback email{" "}
          <Link href="mailto:contact@owlbear.rodeo">contact@owlbear.rodeo</Link>
        </Text>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default About;
