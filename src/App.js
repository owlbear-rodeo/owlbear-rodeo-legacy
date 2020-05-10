import React from "react";
import { ThemeProvider } from "theme-ui";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import theme from "./theme.js";
import Home from "./routes/Home";
import Game from "./routes/Game";
import About from "./routes/About";
import FAQ from "./routes/FAQ";
import ReleaseNotes from "./routes/ReleaseNotes";

import { AuthProvider } from "./contexts/AuthContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <DatabaseProvider>
        <AuthProvider>
          <Router>
            <Switch>
              <Route path="/releaseNotes">
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
        </AuthProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}

export default App;
