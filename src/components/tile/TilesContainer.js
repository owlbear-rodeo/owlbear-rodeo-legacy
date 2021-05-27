import React from "react";
import { Grid, useThemeUI } from "theme-ui";
import SimpleBar from "simplebar-react";

import { useGroup } from "../../contexts/GroupContext";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

function TilesContainer({ children }) {
  const { onGroupSelect } = useGroup();

  const { theme } = useThemeUI();

  const layout = useResponsiveLayout();

  return (
    <>
      <SimpleBar
        style={{
          height: layout.tileContainerHeight,
          backgroundColor: theme.colors.muted,
        }}
        onClick={() => onGroupSelect()}
      >
        <Grid
          p={3}
          pb={4}
          sx={{
            borderRadius: "4px",
            overflow: "hidden",
          }}
          gap={2}
          columns={`repeat(${layout.tileGridColumns}, 1fr)`}
        >
          {children}
        </Grid>
      </SimpleBar>
    </>
  );
}

export default TilesContainer;
