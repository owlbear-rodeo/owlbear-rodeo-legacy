import React from "react";
import { Box } from "theme-ui";
import { useInView } from "react-intersection-observer";

function LazyTile({ children }) {
  const [ref, inView] = useInView({ triggerOnce: false });

  const sx = inView
    ? {}
    : { width: "100%", height: "0", paddingTop: "100%", position: "relative" };

  return (
    <Box sx={sx} ref={ref}>
      {inView ? (
        children
      ) : (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "4px",
          }}
          bg="background"
        />
      )}
    </Box>
  );
}

export default LazyTile;
