import { Flex, Box, Text } from "theme-ui";

function DiceRoll({ rolls, type, children }: { rolls: any, type: string, children: any}) {
  return (
    <Flex sx={{ flexWrap: "wrap" }}>
      <Box sx={{ transform: "scale(0.8)" }}>{children}</Box>
      {rolls
        .filter((d: any) => d.type === type && d.roll !== "unknown")
        .map((dice: any, index: string | number) => (
          <Text as="p" my={1} variant="caption" mx={1} key={index}>
            {dice.roll}
          </Text>
        ))}
    </Flex>
  );
}

export default DiceRoll;
