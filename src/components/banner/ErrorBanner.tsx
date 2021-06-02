import { Box, Text } from "theme-ui";

import Banner from "./Banner";

function ErrorBanner({ error, onRequestClose }: { error: Error | undefined, onRequestClose: any }) {
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
