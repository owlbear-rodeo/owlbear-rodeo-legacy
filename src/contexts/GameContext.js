import React, { useState } from "react";

const GameContext = React.createContext();

export function GameProvider({ children }) {
  const [gameId, setGameId] = useState(null);
  const value = [gameId, setGameId];
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export default GameContext;
