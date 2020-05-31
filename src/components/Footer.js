import React from "react";
import { Flex } from "theme-ui";

import Link from "./Link";

function Footer() {
  return (
    <Flex
      bg="muted"
      sx={{
        height: "48px",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <Link m={2} to="/about" variant="footer">
        About
      </Link>
      <Link m={2} to="/" variant="footer">
        Home
      </Link>
      <Link m={2} to="/faq" variant="footer">
        FAQ
      </Link>
      <Link m={2} to="/releaseNotes" variant="footer">
        Release Notes
      </Link>
    </Flex>
  );
}

export default Footer;
