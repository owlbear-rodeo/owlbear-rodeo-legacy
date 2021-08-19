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

  const tileGridColumns = isLargeScreen ? 4 : isMediumScreen ? 3 : 2;

  const groupGridColumns = isLargeScreen ? 3 : 2;

  const tileContainerHeight = isLargeScreen ? "600px" : "400px";

  return {
    screenSize,
    modalSize,
    tileSize,
    tileGridColumns,
    tileContainerHeight,
    groupGridColumns,
  };
}

export default useResponsiveLayout;
