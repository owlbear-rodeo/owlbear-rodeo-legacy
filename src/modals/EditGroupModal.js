import React, { useEffect, useState } from "react";
import { Box, Button, Label, Flex } from "theme-ui";

import Modal from "../components/Modal";
import Select from "../components/Select";

function EditGroupModal({
  isOpen,
  onRequestClose,
  onChange,
  groups,
  defaultGroup,
}) {
  const [value, setValue] = useState();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (defaultGroup) {
      setValue({ value: defaultGroup, label: defaultGroup });
    } else {
      setValue();
    }
  }, [defaultGroup]);

  useEffect(() => {
    setOptions(groups.map((group) => ({ value: group, label: group })));
  }, [groups]);

  function handleCreate(group) {
    const newOption = { value: group, label: group };
    setValue(newOption);
    setOptions((prev) => [...prev, newOption]);
  }

  function handleChange() {
    onChange(value ? value.value : "");
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ overflow: "visible" }}
    >
      <Box onSubmit={handleChange} sx={{ width: "300px" }}>
        <Label py={2}>Select or add a group</Label>
        <Select
          creatable
          options={options}
          value={value}
          onChange={setValue}
          onCreateOption={handleCreate}
          placeholder=""
        />
        <Flex py={2}>
          <Button sx={{ flexGrow: 1 }} onClick={handleChange}>
            Save
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
}

export default EditGroupModal;
