import React from "react";
import { Flex, IconButton } from "theme-ui";

import AddIcon from "../../icons/AddIcon";
import SelectMultipleIcon from "../../icons/SelectMultipleIcon";
import SelectSingleIcon from "../../icons/SelectSingleIcon";

import Search from "../Search";
import RadioIconButton from "../RadioIconButton";

import { useGroup } from "../../contexts/GroupContext";

function TileActionBar({ onAdd, addTitle }) {
  const {
    selectMode,
    onSelectModeChange,
    onGroupSelect,
    filter,
    onFilterChange,
  } = useGroup();

  return (
    <Flex
      bg="muted"
      sx={{
        border: "1px solid",
        borderColor: "text",
        borderRadius: "4px",
        alignItems: "center",
        ":focus-within": {
          outline: "1px auto",
          outlineColor: "primary",
          outlineOffset: "0px",
        },
      }}
      onFocus={() => onGroupSelect()}
    >
      <Search value={filter} onChange={(e) => onFilterChange(e.target.value)} />
      <Flex
        mr={1}
        px={1}
        sx={{
          borderRight: "1px solid",
          borderColor: "text",
          height: "36px",
          alignItems: "center",
        }}
      >
        <RadioIconButton
          title="Select Single"
          onClick={() => onSelectModeChange("single")}
          isSelected={selectMode === "single"}
        >
          <SelectSingleIcon />
        </RadioIconButton>
        <RadioIconButton
          title="Select Multiple"
          onClick={() => onSelectModeChange("multiple")}
          isSelected={selectMode === "multiple" || selectMode === "range"}
        >
          <SelectMultipleIcon />
        </RadioIconButton>
      </Flex>
      <IconButton onClick={onAdd} aria-label={addTitle} title={addTitle} mr={1}>
        <AddIcon />
      </IconButton>
    </Flex>
  );
}

export default TileActionBar;
