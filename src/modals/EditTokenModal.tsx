import { useState } from "react";
import { Button, Flex, Label, useThemeUI } from "theme-ui";
import SimpleBar from "simplebar-react";

import Modal from "../components/Modal";
import TokenSettings from "../components/token/TokenSettings";
import TokenPreview from "../components/token/TokenPreview";

import { isEmpty } from "../helpers/shared";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

import { Token } from "../types/Token";

import { UpdateTokenEventHandler } from "../contexts/TokenDataContext";

type EditModalProps = {
  isOpen: boolean;
  onDone: () => void;
  token: Token;
  onUpdateToken: UpdateTokenEventHandler;
};

function EditTokenModal({
  isOpen,
  onDone,
  token,
  onUpdateToken,
}: EditModalProps) {
  const { theme } = useThemeUI();

  function handleClose() {
    setTokenSettingChanges({});
    onDone();
  }

  async function handleSave() {
    await applyTokenChanges();
    onDone();
  }

  const [tokenSettingChanges, setTokenSettingChanges] = useState<
    Partial<Token>
  >({});

  // TODO: CHANGE MAP BACK? OR CHANGE THIS TO PARTIAL
  function handleTokenSettingsChange(change: Partial<Token>) {
    setTokenSettingChanges((prevChanges) => ({
      ...prevChanges,
      ...change,
    }));
  }

  async function applyTokenChanges() {
    if (token && !isEmpty(tokenSettingChanges)) {
      // Ensure size value is positive
      let verifiedChanges = { ...tokenSettingChanges };
      if ("defaultSize" in verifiedChanges) {
        verifiedChanges.defaultSize = verifiedChanges.defaultSize || 1;
      }

      await onUpdateToken(token.id, verifiedChanges);
      setTokenSettingChanges({});
    }
  }

  const selectedTokenWithChanges = {
    ...token,
    ...tokenSettingChanges,
  } as Token;

  const layout = useResponsiveLayout();

  if (!token) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{
        content: {
          maxWidth: layout.modalSize,
          width: "calc(100% - 16px)",
          padding: 0,
          display: "flex",
          overflow: "hidden",
        },
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          width: "100%",
        }}
      >
        <Label pt={2} pb={1} px={3}>
          Edit token
        </Label>
        <SimpleBar
          style={{
            minHeight: 0,
            padding: "16px",
            backgroundColor: theme.colors?.muted as string,
            margin: "0 8px",
            height: "100%",
          }}
        >
          <TokenPreview token={selectedTokenWithChanges} />
          <TokenSettings
            token={selectedTokenWithChanges}
            onSettingsChange={handleTokenSettingsChange}
          />
        </SimpleBar>
        <Button m={3} onClick={handleSave}>
          Save
        </Button>
      </Flex>
    </Modal>
  );
}

export default EditTokenModal;
