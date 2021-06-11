import React, { useState, useEffect } from "react";
import { Flex, Close, IconButton } from "theme-ui";

import { groupsFromIds, itemsFromGroups } from "../../helpers/group";

import ConfirmModal from "../../modals/ConfirmModal";

import TokenShowIcon from "../../icons/TokenShowIcon";
import TokenHideIcon from "../../icons/TokenHideIcon";
import RemoveTokenIcon from "../../icons/RemoveTokenIcon";

import { useGroup } from "../../contexts/GroupContext";
import { useTokenData } from "../../contexts/TokenDataContext";
import { useKeyboard } from "../../contexts/KeyboardContext";

import shortcuts from "../../shortcuts";

function TokenEditBar({ disabled, onLoad }) {
  const { tokens, removeTokens, updateTokensHidden } = useTokenData();

  const { activeGroups, selectedGroupIds, onGroupSelect } = useGroup();

  const [allTokensVisible, setAllTokensVisisble] = useState(false);

  useEffect(() => {
    const selectedGroups = groupsFromIds(selectedGroupIds, activeGroups);
    const selectedTokens = itemsFromGroups(selectedGroups, tokens);

    setAllTokensVisisble(selectedTokens.every((token) => !token.hideInSidebar));
  }, [selectedGroupIds, tokens, activeGroups]);

  function getSelectedTokens() {
    const selectedGroups = groupsFromIds(selectedGroupIds, activeGroups);
    return itemsFromGroups(selectedGroups, tokens);
  }

  const [isTokensRemoveModalOpen, setIsTokensRemoveModalOpen] = useState(false);
  async function handleTokensRemove() {
    onLoad(true);
    setIsTokensRemoveModalOpen(false);
    const selectedTokens = getSelectedTokens();
    const selectedTokenIds = selectedTokens.map((token) => token.id);
    onGroupSelect();
    await removeTokens(selectedTokenIds);
    onLoad(false);
  }

  async function handleTokensHide(hideInSidebar) {
    const selectedTokens = getSelectedTokens();
    const selectedTokenIds = selectedTokens.map((token) => token.id);
    updateTokensHidden(selectedTokenIds, hideInSidebar);
  }

  /**
   * Shortcuts
   */
  function handleKeyDown(event) {
    if (disabled) {
      return;
    }
    if (shortcuts.delete(event)) {
      const selectedTokens = getSelectedTokens();
      if (selectedTokens.length > 0) {
        // Ensure all other modals are closed
        setIsTokensRemoveModalOpen(true);
      }
    }
  }

  useKeyboard(handleKeyDown);

  if (selectedGroupIds.length === 0) {
    return null;
  }

  let hideTitle = "";
  if (allTokensVisible) {
    hideTitle = "Hide Selected Token(s) in Sidebar";
  } else {
    hideTitle = "Show Selected Token(s) in Sidebar";
  }

  return (
    <Flex
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "space-between",
      }}
      bg="overlay"
    >
      <Close
        title="Clear Selection"
        aria-label="Clear Selection"
        onClick={() => onGroupSelect()}
      />
      <Flex>
        <IconButton
          aria-label={hideTitle}
          title={hideTitle}
          onClick={() => handleTokensHide(allTokensVisible)}
        >
          {allTokensVisible ? <TokenShowIcon /> : <TokenHideIcon />}
        </IconButton>
        <IconButton
          aria-label="Remove Selected Token(s)"
          title="Remove Selected Token(s)"
          onClick={() => handleTokensRemove()}
        >
          <RemoveTokenIcon />
        </IconButton>
      </Flex>
      <ConfirmModal
        isOpen={isTokensRemoveModalOpen}
        onRequestClose={() => setIsTokensRemoveModalOpen(false)}
        onConfirm={handleTokensRemove}
        confirmText="Remove"
        label="Remove Selected Token(s)"
        description="This operation cannot be undone."
      />
    </Flex>
  );
}

export default TokenEditBar;
