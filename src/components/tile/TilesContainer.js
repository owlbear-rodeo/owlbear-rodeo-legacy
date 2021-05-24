import React from "react";
import SimpleBar from "simplebar-react";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

function TilesContainer({ children }) {
  const layout = useResponsiveLayout();

  return (
    <SimpleBar style={{ height: layout.tileContainerHeight }}>
      {children}
    </SimpleBar>
  );
}

export default TilesContainer;
