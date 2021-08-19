import { Box, Text } from "theme-ui";

import Banner from "./Banner";

import { RequestCloseEventHandler } from "../../types/Events";

type ErrorBannerProps = {
  error: Error | undefined;
  onRequestClose: RequestCloseEventHandler;
};

function ErrorBanner({ error, onRequestClose }: ErrorBannerProps) {
  return (
    <Banner isOpen={!!error} onRequestClose={onRequestClose}>
      <Box p={1}>
        <Text as="p" variant="body2">
          Error: {error && error.message}
        </Text>
      </Box>
    </Banner>
  );
}

export default ErrorBanner;
