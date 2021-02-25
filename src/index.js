import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";
import App from "./App";
import Modal from "react-modal";

// Add css for simplebar
import "simplebar/dist/simplebar.min.css";

import * as serviceWorker from "./serviceWorker";

import "./index.css";

if (process.env.REACT_APP_LOGGING === "true") {
  Sentry.init({
    dsn:
      "https://bc1e2edfe7ca453f8e7357a48693979e@o467475.ingest.sentry.io/5493956",
    release: "owlbear-rodeo@" + process.env.REACT_APP_VERSION,
    // Ignore resize error as it is triggered by going fullscreen on slower computers
    // Ignore quota error
    // Ignore XDR encoding failure bug in Firefox https://bugzilla.mozilla.org/show_bug.cgi?id=1678243
    // Ignore LastPass extension text error
    // Ignore chrome extension error
    // Ignore dexie error todo: fix
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "QuotaExceededError",
      "XDR encoding failure",
      "Assertion failed: Input argument is not an HTMLInputElement",
      "Extension context invalidated",
      "InvalidStateError",
      new RegExp("[a-zA-Z]*Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing*"),
    ],
  });
}

Modal.setAppElement("#root");

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
