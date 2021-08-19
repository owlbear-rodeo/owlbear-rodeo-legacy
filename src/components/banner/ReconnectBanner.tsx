import { Flex } from "theme-ui";

import Banner from "./Banner";
import ReconnectingIcon from "../../icons/ReconnectingIcon";

function ReconnectBanner({ isOpen }: { isOpen: boolean }) {
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
        title="Disconnected. Attempting to reconnect..."
        aria-label="Disconnected. Attempting to reconnect..."
      >
        <ReconnectingIcon />
      </Flex>
    </Banner>
  );
}

export default ReconnectBanner;
