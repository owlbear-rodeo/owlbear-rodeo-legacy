import { Flex, Box, Input, Label } from "theme-ui";

import { isEmpty } from "../../helpers/shared";

import Select from "../Select";

import { Token, TokenCategory } from "../../types/Token";
import { TokenSettingsChangeEventHandler } from "../../types/Events";

type CategorySetting = { value: TokenCategory; label: string };
const categorySettings: CategorySetting[] = [
  { value: "character", label: "Character" },
  { value: "prop", label: "Prop" },
  { value: "vehicle", label: "Mount" },
  { value: "attachment", label: "Attachment" },
];

type TokenSettingsProps = {
  token: Token;
  onSettingsChange: TokenSettingsChangeEventHandler;
};

function TokenSettings({ token, onSettingsChange }: TokenSettingsProps) {
  const tokenEmpty = !token || isEmpty(token);
  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Box mt={2} sx={{ flexGrow: 1 }}>
        <Label htmlFor="name">Name</Label>
        <Input
          name="name"
          value={(token && token.name) || ""}
          onChange={(e) => onSettingsChange({ name: e.target.value })}
          disabled={tokenEmpty}
          my={1}
        />
      </Box>
      <Box mt={2}>
        <Label>Default Category</Label>
        <Select
          options={categorySettings}
          value={
            tokenEmpty
              ? undefined
              : categorySettings.find((s) => s.value === token.defaultCategory)
          }
          isDisabled={tokenEmpty}
          onChange={
            ((option: CategorySetting) =>
              onSettingsChange({ defaultCategory: option.value })) as any
          }
          isSearchable={false}
        />
      </Box>
      <Box mt={2} sx={{ flexGrow: 1 }}>
        <Label htmlFor="tokenSize">Default Size</Label>
        <Input
          type="number"
          name="tokenSize"
          value={`${(token && token.defaultSize) || 0}`}
          onChange={(e) =>
            onSettingsChange({ defaultSize: parseFloat(e.target.value) })
          }
          disabled={tokenEmpty}
          min={1}
          my={1}
        />
      </Box>
      <Box my={2} mb={3} sx={{ flexGrow: 1 }}>
        <Label htmlFor="label">Default Label</Label>
        <Input
          name="label"
          value={(token && token.defaultLabel) || ""}
          onChange={(e) => onSettingsChange({ defaultLabel: e.target.value })}
          disabled={tokenEmpty}
          my={1}
        />
      </Box>
    </Flex>
  );
}

export default TokenSettings;
