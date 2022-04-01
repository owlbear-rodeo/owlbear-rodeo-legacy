import React from "react";
import { Box, Text } from "theme-ui";
import { AppearanceTypes, ToastProvider as DefaultToastProvider } from "react-toast-notifications";

function getToastAppearance(appearance: AppearanceTypes) {
  let colour = "overlay"
  if (appearance === "error") {
    colour = "highlight"
  } else if (appearance === "info") {
    colour = "overlay"
  } else if (appearance === "warning") {
    colour = "secondary"
  } else if (appearance === "success") {
    colour = "primary"
  }
  return colour;
}

function CustomToast({ appearance, children }: { appearance: AppearanceTypes, children: React.ReactNode }) {
  return (
    <Box
      m={2}
      mb={0}
      bg={appearance ? getToastAppearance(appearance) : "overlay"}
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
