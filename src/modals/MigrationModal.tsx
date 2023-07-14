import { Box, Button, Text } from "theme-ui";
import Modal from "../components/Modal";

import { useState } from "react";

function MigrationModal() {
  const [open, setOpen] = useState(true);

  return (
    <Modal
      isOpen={open}
      onRequestClose={() => {
        setOpen(false);
      }}
      style={{ content: { maxWidth: "450px" } }}
    >
      <Box>
        <Text py={2} sx={{ textAlign: "center" }}>
          <h1>Migrate Now</h1>
        </Text>
        <img
          src="/nestling.png"
          alt="nestling"
          style={{ width: 200, margin: "0 auto", display: "block" }}
        />
        <Text
          as="p"
          variant="body"
          sx={{ flexGrow: 1, textAlign: "center", mt: 3 }}
        >
          Make sure to migrate your data before July 18th.
        </Text>
        <Button
          //@ts-ignore
          href="https://blog.owlbear.rodeo/owlbear-rodeo-2-0-release-date-announcement/"
          target="_blank"
          rel="noopener noreferrer"
          as="a"
          variant="primary"
          sx={{
            backgroundColor: "hsl(260, 100%, 80%)",
            color: "black",
            border: "none",
            width: "100%",
            mt: 4,
          }}
        >
          Read more
        </Button>
      </Box>
    </Modal>
  );
}

export default MigrationModal;
