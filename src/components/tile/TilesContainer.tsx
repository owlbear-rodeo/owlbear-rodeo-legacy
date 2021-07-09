import React from "react";
import { Grid, useThemeUI } from "theme-ui";
import SimpleBar from "simplebar-react";

import { useGroup } from "../../contexts/GroupContext";
import { ADD_TO_MAP_ID } from "../../contexts/TileDragContext";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

import Droppable from "../drag/Droppable";

function TilesContainer({ children }: { children: React.ReactNode }) {
  const { onGroupSelect } = useGroup();

  const { theme } = useThemeUI();

  const layout = useResponsiveLayout();

  return (
    <>
      <SimpleBar
        style={{
          height: layout.tileContainerHeight,
          backgroundColor: theme.colors?.muted as string,
        }}
        onClick={() => onGroupSelect(undefined)}
      >
        <Grid
          p={3}
          pb={4}
          sx={{
            borderRadius: "4px",
            overflow: "hidden",
            position: "relative",
          }}
          gap={2}
          columns={`repeat(${layout.tileGridColumns}, 1fr)`}
        >
          <Droppable
            id={ADD_TO_MAP_ID}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: -1,
            }}
          />
          {children}
        </Grid>
      </SimpleBar>
    </>
  );
}

export default TilesContainer;
