import { useMedia } from "react-media";

function useResponsiveLayout() {
  const isMediumScreen = useMedia({ query: "(min-width: 500px)" });
  const isLargeScreen = useMedia({ query: "(min-width: 1500px)" });
  const screenSize = isLargeScreen
    ? "large"
    : isMediumScreen
    ? "medium"
    : "small";

  const modalSize = isLargeScreen
    ? "842px"
    : isMediumScreen
    ? "642px"
    : "500px";

  const tileSize = isLargeScreen
    ? "small"
    : isMediumScreen
    ? "medium"
    : "large";

  const gridTemplate = isLargeScreen
    ? "1fr 1fr 1fr 1fr"
    : isMediumScreen
    ? "1fr 1fr 1fr"
    : "1fr 1fr";

  const tileContainerHeight = isLargeScreen ? "600px" : "400px";

  return { screenSize, modalSize, tileSize, gridTemplate, tileContainerHeight };
}

export default useResponsiveLayout;
