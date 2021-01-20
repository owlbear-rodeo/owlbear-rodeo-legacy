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

  return { screenSize, modalSize, tileSize };
}

export default useResponsiveLayout;
