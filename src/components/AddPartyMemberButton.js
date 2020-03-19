import React, { useState } from "react";
import Modal from "react-modal";
import {
  IconButton,
  Flex,
  Box,
  Label,
  Close,
  useThemeUI,
  Text
} from "theme-ui";

function AddPartyMemberButton({ streamId }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { theme } = useThemeUI();

  function openModal() {
    setIsAddModalOpen(true);
  }

  function closeModal() {
    setIsAddModalOpen(false);
  }

  return (
    <>
      <Flex sx={{ justifyContent: "center" }} p={2}>
        <IconButton aria-label="Add Party Member" onClick={openModal}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            fill="currentcolor"
          >
            <path d="M0 0h24v24H0V0z" fill="none" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 11h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H8c-.55 0-1-.45-1-1s.45-1 1-1h3V8c0-.55.45-1 1-1s1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1z" />
          </svg>
        </IconButton>
      </Flex>
      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={closeModal}
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.73)" },
          content: {
            backgroundColor: theme.colors.background,
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)"
          }
        }}
      >
        <Box>
          <Label p={2}>Other people can join using your ID (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</Label>
          <Box p={2} bg="hsla(230, 20%, 0%, 20%)">
            <Text>{streamId}</Text>
          </Box>
          <Close
            m={1}
            sx={{ position: "absolute", top: 0, right: 0 }}
            onClick={closeModal}
          />
        </Box>
      </Modal>
    </>
  );
}

export default AddPartyMemberButton;
