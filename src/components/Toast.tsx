import React from "react";
import { Box, Text } from "theme-ui";
import { ToastProvider as DefaultToastProvider } from "react-toast-notifications";

function CustomToast({ children }: { children?: React.ReactNode }) {
  return (
    <Box
      m={2}
      mb={0}
      bg="overlay"
      sx={{ borderRadius: "4px", padding: "12px 16px" }}
    >
      <Text as="p" variant="body2">
        {children}
      </Text>
    </Box>
  );
}

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  return (
    <DefaultToastProvider
      components={{ Toast: CustomToast }}
      autoDismiss={true}
      autoDismissTimeout={2000}
      placement="bottom-center"
    >
      {children}
    </DefaultToastProvider>
  );
}
