import React, { useContext, useEffect } from "react";
import { A } from "hookrouter";

import GameContext from "../contexts/GameContext";
import useSession from "../helpers/useSession";

function Game() {
  const [gameId, setGameId] = useContext(GameContext);
  const [peer, peerId, connections, connectTo] = useSession();

  useEffect(() => {
    if (gameId !== null && peerId !== null) {
      connectTo(gameId);
    }
  }, [gameId, peerId]);

  return (
    <div>
      {gameId ? `You've joined ${gameId}` : "You've started a new game"}
      <A href="/">GO TO HOME</A>GAME!
    </div>
  );
}

export default Game;
