import { Grid } from "theme-ui";

import Tile from "../tile/Tile";
import TokenImage from "./TokenImage";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";
import { GroupContainer } from "../../types/Group";
import { Token } from "../../types/Token";

type TokenTileProps = {
  group: GroupContainer;
  tokens: Token[];
  isSelected: boolean;
  onSelect: (tokenId: string) => void;
  onDoubleClick: () => void;
};

function TokenTileGroup({
  group,
  tokens,
  isSelected,
  onSelect,
  onDoubleClick,
}: TokenTileProps) {
  const layout = useResponsiveLayout();

  return (
    <Tile
      title={group.name}
      isSelected={isSelected}
      onSelect={() => onSelect(group.id)}
      onDoubleClick={onDoubleClick}
    >
      <Grid
        columns={`repeat(${layout.groupGridColumns}, 1fr)`}
        p={2}
        gap={2}
        sx={{
          height: "100%",
          gridTemplateRows: `repeat(${layout.groupGridColumns}, 1fr)`,
        }}
      >
        {tokens
          .slice(0, layout.groupGridColumns * layout.groupGridColumns)
          .map((token) => (
            <TokenImage
              sx={{ borderRadius: "8px" }}
              token={token}
              key={`${token.id}-group-tile`}
            />
          ))}
      </Grid>
    </Tile>
  );
}

export default TokenTileGroup;
