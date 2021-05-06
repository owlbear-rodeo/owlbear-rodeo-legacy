import React from "react";
import { ThemeProvider } from "theme-ui";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import theme from "./theme.js";
import Home from "./routes/Home";
import Game from "./routes/Game";
import About from "./routes/About";
import FAQ from "./routes/FAQ";
import ReleaseNotes from "./routes/ReleaseNotes";
import HowTo from "./routes/HowTo";
import Donate from "./routes/Donate";

import { AuthProvider } from "./contexts/AuthContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { KeyboardProvider } from "./contexts/KeyboardContext";

import { ToastProvider } from "./components/Toast";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <DatabaseProvider>
        <SettingsProvider>
          <AuthProvider>
            <KeyboardProvider>
              <ToastProvider>
                <Router>
                  <Switch>
                    <Route path="/donate">
                      <Donate />
                    </Route>
                    {/* Legacy support camel case routes */}
                    <Route path={["/howTo", "/how-to"]}>
                      <HowTo />
                    </Route>
                    <Route path={["/releaseNotes", "/release-notes"]}>
                      <ReleaseNotes />
                    </Route>
                    <Route path="/about">
                      <About />
                    </Route>
                    <Route path="/faq">
                      <FAQ />
                    </Route>
                    <Route path="/game/:id">
                      <Game />
                    </Route>
                    <Route path="/">
                      <Home />
                    </Route>
                  </Switch>
                </Router>
              </ToastProvider>
            </KeyboardProvider>
          </AuthProvider>
        </SettingsProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}

export default App;
