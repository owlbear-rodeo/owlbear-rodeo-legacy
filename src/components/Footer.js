import React from "react";
import { Flex, Link } from "theme-ui";

function Footer() {
  return (
    <Flex
      bg="muted"
      sx={{
        height: "48px",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Link m={2} href="#/about" variant="footer">
        About
      </Link>
      <Link m={2} href="#/" variant="footer">
        Home
      </Link>
      <Link m={2} href="#/faq" variant="footer">
        FAQ
      </Link>
    </Flex>
  );
}

export default Footer;
