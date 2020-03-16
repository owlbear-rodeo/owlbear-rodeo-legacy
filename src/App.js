import React from "react";
import { useRoutes } from "hookrouter";
import { ThemeProvider } from "theme-ui";
import { GameProvider } from "./contexts/GameContext";

import theme from "./theme.js";
import Home from "./routes/Home";
import Game from "./routes/Game";
import Join from "./routes/Join";

const routes = {
  "/": () => <Home />,
  "/game": () => <Game />,
  "/join": () => <Join />
};

function App() {
  const route = useRoutes(routes);
  return (
    <ThemeProvider theme={theme}>
      <GameProvider>{route}</GameProvider>
    </ThemeProvider>
  );
}

export default App;
