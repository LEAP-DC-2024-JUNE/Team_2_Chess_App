"use client";

import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const ChessboardContainer = () => {
  const [game, setGame] = useState(new Chess());
  // const [currentTimeout, setCurrentTimeout] = useState<NodeJS.Timeout>();
  function safeGameMutate(modify: (game: Chess) => void) {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      return update;
    });
  }
  function makeRandomMove(currentPosition: string) {
    const gameCopy = new Chess(currentPosition);
    const possibleMoves = gameCopy.moves();
    gameCopy.fen();
    console.log("possible moves: " + possibleMoves);

    // exit if the game is over
    if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0)
      return;
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    safeGameMutate((game: Chess) => {
      game.move(possibleMoves[randomIndex]);
    });
  }
  function onDrop(sourceSquare: string, targetSquare: string, piece: string) {
    let move;
    let position = game.fen();
    setGame((game) => {
      const gameCopy = new Chess(game.fen());
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1].toLowerCase() ?? "q",
      });

      position = gameCopy.fen();

      return gameCopy;
    });

    // illegal move
    if (move === null) return false;

    // store timeout so it can be cleared on undo/reset so computer doesn't execute move
    // const newTimeout = setTimeout(() => {
    makeRandomMove(position);
    // }, 200);
    // setCurrentTimeout(newTimeout);
    return true;
  }
  return (
    <div className="w-[600px] h-[600px]">
      <Chessboard
        id="PlayVsRandom"
        position={game.fen()}
        onPieceDrop={onDrop}
        customBoardStyle={{
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
      />
    </div>
  );
};

export default ChessboardContainer;
