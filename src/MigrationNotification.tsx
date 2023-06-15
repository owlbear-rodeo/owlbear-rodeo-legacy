import { useState } from "react";
import { Box, Close, Link, Text } from "theme-ui";

export function MigrationNotification() {
  const [closed, setClosed] = useState(false);

  if (closed) {
    return null;
  }

  return (
    <Box
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000 }}
      bg="highlight"
    >
      <Box
        m={2}
        mb={0}
        sx={{
          borderRadius: "4px",
          padding: "12px 16px",
          display: "flex",
        }}
      >
        <Text as="p" variant="body2" sx={{ flexGrow: 1, textAlign: "center" }}>
          The new era of Owlbear Rodeo is coming on July 18th. Make sure to
          migrate your data before July 18th.{" "}
          <Link
            href="https://blog.owlbear.rodeo/owlbear-rodeo-2-0-release-date-announcement/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read more
          </Link>
        </Text>
        <Close onClick={() => setClosed(true)} sx={{ minWidth: "32px" }} />
      </Box>
    </Box>
  );
}
