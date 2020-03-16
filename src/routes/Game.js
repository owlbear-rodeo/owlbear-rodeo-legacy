import React, { useContext } from "react";
import { A } from "hookrouter";

import GameContext from "../contexts/GameContext";

function Game() {
  const [gameId, setGameId] = useContext(GameContext);

  return (
    <div>
      {gameId ? `You've joined ${gameId}` : "You've started a new game"}
      <A href="/">GO TO HOME</A>GAME!
    </div>
  );
}

export default Game;
