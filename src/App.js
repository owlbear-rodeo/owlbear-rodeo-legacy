import React from "react";
import { useRoutes } from "hookrouter";
import { ThemeProvider } from "theme-ui";

import theme from "./theme.js";
import Home from "./routes/Home";
import Game from "./routes/Game";
import Join from "./routes/Join";

const routes = {
  "/": () => <Home />,
  "/game/:id": ({ id }) => <Game gameId={id} />,
  "/join": () => <Join />,
};

function App() {
  const route = useRoutes(routes);
  return <ThemeProvider theme={theme}>{route}</ThemeProvider>;
}

export default App;
