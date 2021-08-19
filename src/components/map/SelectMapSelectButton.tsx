import { Button } from "theme-ui";

import { useGroup } from "../../contexts/GroupContext";

import { findGroup } from "../../helpers/group";

type SelectMapSelectButtonProps = {
  onMapSelect: (mapId: string) => void;
  disabled: boolean;
};

function SelectMapSelectButton({
  onMapSelect,
  disabled,
}: SelectMapSelectButtonProps) {
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
