import { Flex } from "theme-ui";

import Banner from "./Banner";
import OfflineIcon from "../../icons/OfflineIcon";

function OfflineBanner({ isOpen }: { isOpen: boolean }) {
  return (
    <Banner
      isOpen={isOpen}
      onRequestClose={() => {}}
      allowClose={false}
      backgroundColor="transparent"
    >
      <Flex
        sx={{
          width: "28px",
          height: "28px",
          borderRadius: "28px",
          alignItems: "center",
          justifyContent: "center",
        }}
        bg="overlay"
        title="Unable to connect to game, refresh to reconnect."
        aria-label="Unable to connect to game, refresh to reconnect."
      >
        <OfflineIcon />
      </Flex>
    </Banner>
  );
}

export default OfflineBanner;
