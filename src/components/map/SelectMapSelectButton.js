import React from "react";
import { Button } from "theme-ui";

import { useGroup } from "../../contexts/GroupContext";

import { findGroup } from "../../helpers/group";

function SelectMapSelectButton({ onMapSelect, disabled }) {
  const { activeGroups, selectedGroupIds } = useGroup();

  function handleSelectClick() {
    if (selectedGroupIds.length === 1) {
      const group = findGroup(activeGroups, selectedGroupIds[0]);
      if (group && group.type === "item") {
        onMapSelect(group.id);
      }
    }
  }

  return (
    <Button
      variant="primary"
      disabled={disabled || selectedGroupIds.length > 1}
      onClick={handleSelectClick}
      mt={2}
    >
      Select
    </Button>
  );
}

export default SelectMapSelectButton;
