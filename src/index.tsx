import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";
import { Dedupe } from "@sentry/integrations";
import App from "./App";
import Modal from "react-modal";

// Add css for simplebar
import "simplebar/dist/simplebar.min.css";

import * as serviceWorker from "./serviceWorker";

import "./index.css";

// Pointer events shim
if (!("PointerEvent" in window)) {
  import("pepjs");
}

// Intersection observer polyfill
if (!("IntersectionObserver" in window)) {
  import("intersection-observer");
}

if (process.env.REACT_APP_LOGGING === "true") {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    release: "owlbear-rodeo@" + process.env.REACT_APP_VERSION,
    integrations: [new Dedupe()],
    // Ignore resize error as it is triggered by going fullscreen on slower computers
    // Ignore quota error
    // Ignore XDR encoding failure bug in Firefox https://bugzilla.mozilla.org/show_bug.cgi?id=1678243
    // Ignore LastPass extension text error
    // Ignore chrome extension error
    // Ignore dexie error todo: fix
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "QuotaExceededError",
      "DatabaseClosedError",
      "XDR encoding failure",
      "Assertion failed: Input argument is not an HTMLInputElement",
      "Extension context invalidated",
      new RegExp(
        "([InvalidStateError:\\s]*Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing([.]*[\\s]*))+"
      ),
      "Browser is shutting down",
      "An internal error was encountered in the Indexed Database server",
      // Random plugins/extensions
      "top.GLOBALS",
      // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
      "originalCreateNotification",
      "canvas.contentDocument",
      "MyApp_RemoveAllHighlights",
      "http://tt.epicplay.com",
      "Can't find variable: ZiteReader",
      "jigsaw is not defined",
      "ComboSearch is not defined",
      "http://loading.retry.widdit.com/",
      "atomicFindClose",
      // Facebook borked
      "fb_xd_fragment",
      // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
      // reduce this. (thanks @acdha)
      // See http://stackoverflow.com/questions/4113268
      "bmi_SafeAddOnload",
      "EBCallBackMessageReceived",
      // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
      "conduitPage",
    ],
    denyUrls: [
      // Facebook flakiness
      /graph\.facebook\.com/i,
      // Facebook blocked
      /connect\.facebook\.net\/en_US\/all\.js/i,
      // Woopra flakiness
      /eatdifferent\.com\.woopra-ns\.com/i,
      /static\.woopra\.com\/js\/woopra\.js/i,
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Other plugins
      /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
      /webappstoolbarba\.texthelp\.com\//i,
      /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
    ],
  });
}

Modal.setAppElement("#root");

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
