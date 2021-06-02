import { useEffect, useState } from "react";
import { Box, Button, Label, Flex } from "theme-ui";

import Modal from "../components/Modal";
import Select from "../components/Select";

type EditGroupProps = {
  isOpen: boolean,
  onRequestClose: () => void,
  onChange: any,
  groups: string[],
  defaultGroup: string | undefined | false,
}

function EditGroupModal({
  isOpen,
  onRequestClose,
  onChange,
  groups,
  defaultGroup,
}: EditGroupProps) {
  const [value, setValue] = useState<{ value: string; label: string; } | undefined>();
  const [options, setOptions] = useState<{ value: string; label: string; }[]>([]);

  useEffect(() => {
    if (defaultGroup) {
      setValue({ value: defaultGroup, label: defaultGroup });
    } else {
      setValue(undefined);
    }
  }, [defaultGroup]);

  useEffect(() => {
    setOptions(groups.map((group) => ({ value: group, label: group })));
  }, [groups]);

  function handleCreate(group: string) {
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
      style={{ content: { overflow: "visible" } }}
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
