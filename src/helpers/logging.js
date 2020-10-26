import { captureException } from "@sentry/react";

export function logError(error) {
  console.error(error);
  if (process.env.NODE_ENV === "production") {
    captureException(error);
  }
}
