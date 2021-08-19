import { Flex } from "theme-ui";

import TokenShowIcon from "../../icons/TokenShowIcon";
import TokenHideIcon from "../../icons/TokenHideIcon";

type TokenHiddenBadgeProps = {
  hidden: boolean;
};

function TokenHiddenBadge({ hidden }: TokenHiddenBadgeProps) {
  return (
    <Flex
      sx={{
        height: "15px",
        width: "15px",
        alignItems: "center",
      }}
    >
      {hidden ? <TokenHideIcon /> : <TokenShowIcon />}
    </Flex>
  );
}

export default TokenHiddenBadge;
