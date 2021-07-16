import { captureException } from "@sentry/react";

export function logError(error: Error): void {
  console.error(error);
  if (process.env.REACT_APP_LOGGING === "true") {
    captureException(error);
  }
}
