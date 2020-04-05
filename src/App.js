import React from "react";
import { ThemeProvider } from "theme-ui";
import { HashRouter as Router, Switch, Route } from "react-router-dom";

import theme from "./theme.js";
import Home from "./routes/Home";
import Game from "./routes/Game";
import Join from "./routes/Join";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Switch>
          <Route path="/join">
            <Join />
          </Route>
          <Route path="/game/:id">
            <Game />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </Router>
    </ThemeProvider>
  );
}

export default App;
