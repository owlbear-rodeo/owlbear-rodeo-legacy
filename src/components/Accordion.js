import React, { useState } from "react";
import { Box, Flex, Text, IconButton, Divider } from "theme-ui";

import ExpandMoreIcon from "../icons/ExpandMoreIcon";

function Accordion({ heading, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box sx={{ width: "100%" }}>
      <Flex
        sx={{ justifyContent: "space-between" }}
        onClick={() => setOpen(!open)}
        my={1}
      >
        <Text as="h1" variant="heading" sx={{ fontSize: 5 }}>
          {heading}
        </Text>
        <IconButton
          title={open ? "Show Less" : "Show More"}
          aria-label={open ? "Show Less" : "Show More"}
          sx={{ transform: open ? "rotate(0deg)" : "rotate(180deg)" }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Flex>
      {open && children}
      <Divider bg="text" sx={{ opacity: 0.25 }} />
    </Box>
  );
}

Accordion.defaultProps = {
  defaultOpen: false,
};

export default Accordion;
