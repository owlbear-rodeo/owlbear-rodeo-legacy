import React from "react";
import { Box, Grid } from "theme-ui";
import SimpleBar from "simplebar-react";

import { useGroup } from "../../contexts/GroupContext";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

function TilesContainer({ children }) {
  const { onGroupSelect } = useGroup();

  const layout = useResponsiveLayout();

  return (
    <SimpleBar style={{ height: layout.tileContainerHeight }}>
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
        }}
        bg="muted"
        onClick={() => onGroupSelect()}
      />
      <Grid
        p={3}
        pb={4}
        sx={{
          borderRadius: "4px",
          overflow: "hidden",
        }}
        gap={2}
        columns={layout.gridTemplate}
      >
        {children}
      </Grid>
    </SimpleBar>
  );
}

export default TilesContainer;
