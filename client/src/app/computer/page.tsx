"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chess, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import {
  loadGameState,
  saveGameState,
  clearGameState,
  updateMoves,
  getGameResult,
  getGameOverMessage,
  getIsGameOver,
  generatePGN,
  downloadPGN,
  getComputerMove,
  MoveRow,
} from "@/utils/Computer";
import {
  GameSetting,
  ContinuePrompt,
  GameOverMessage,
  MoveListSidebar,
} from "@/components/Computer";

// --- Main Page Component ---
/**
 * Main page component for playing chess vs computer.
 * Handles all game state, move logic, and UI.
 */
const ComputerGamePage = () => {
  const [game, setGame] = useState(new Chess());
  const [resigned, setResigned] = useState(false);
  const [playerColor, setPlayerColor] = useState<"w" | "b" | null>(null);
  const [moves, setMoves] = useState<MoveRow[]>([]);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [pendingState, setPendingState] = useState<{
    fen: string | undefined;
    moves: MoveRow[];
    playerColor: "w" | "b" | null;
    resigned: boolean;
  } | null>(null);
  const [skillLevel, setSkillLevel] = useState(10);
  const isMakingMove = useRef(false);

  /**
   * Loads a saved game on mount, or starts a new game.
   */
  useEffect(() => {
    const parsed = loadGameState();
    if (parsed) {
      const tempGame = new Chess(parsed.fen || undefined);
      if (
        (parsed.moves?.length > 0 || parsed.playerColor) &&
        !getIsGameOver(tempGame, parsed.resigned)
      ) {
        setShowContinuePrompt(true);
        setPendingState({
          fen: parsed.fen || undefined,
          moves: parsed.moves || [],
          playerColor: parsed.playerColor ?? null,
          resigned: parsed.resigned ?? false,
        });
      } else {
        setGame(new Chess(parsed.fen || undefined));
        setMoves(parsed.moves || []);
        setPlayerColor(parsed.playerColor ?? null);
        setResigned(parsed.resigned ?? false);
      }
    }
  }, []);

  /**
   * Saves the game state to localStorage whenever it changes.
   */
  useEffect(() => {
    saveGameState({
      fen: game.fen(),
      moves,
      playerColor,
      resigned,
    });
  }, [game, moves, playerColor, resigned]);

  /**
   * Triggers the computer move when it's the computer's turn.
   */
  useEffect(() => {
    if (
      playerColor &&
      !resigned &&
      !game.isGameOver() &&
      !game.isDraw() &&
      game.turn() !== playerColor &&
      !isMakingMove.current
    ) {
      isMakingMove.current = true;
      getComputerMove(game.fen(), skillLevel)
        .then((bestMoveUci) => {
          if (!bestMoveUci) return;
          const gameCopy = new Chess(game.fen());
          const move = gameCopy.move({
            from: bestMoveUci.slice(0, 2),
            to: bestMoveUci.slice(2, 4),
            promotion: "q",
          });
          setGame(gameCopy);
          if (move) setMoves((prev) => updateMoves(prev, move));
        })
        .finally(() => {
          isMakingMove.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.fen(), playerColor, resigned, skillLevel]);

  /**
   * Handles user piece drop (move).
   */
  const onDrop = (
    sourceSquare: string,
    targetSquare: string,
    piece: string
  ) => {
    const gameCopy = new Chess(game.fen());
    let move: Move | null = null;
    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1].toLowerCase() ?? "q",
      });
    } catch (error) {
      console.error("Invalid move" + error);
    }

    if (!move) {
      console.log("Move was invalid.");
      return false;
    }
    setGame(gameCopy);
    setMoves((prev) => updateMoves(prev, move!));
    return true;
  };

  /** Handles resigning from the game. */
  const handleResign = () => setResigned(true);

  /** Starts a new game and clears all state. */
  const handleNewGame = () => {
    setGame(new Chess());
    setResigned(false);
    setPlayerColor(null);
    setMoves([]);
    clearGameState();
    setShowContinuePrompt(false);
    setPendingState(null);
  };

  /** Continues a previously saved game. */
  const handleContinueGame = () => {
    if (pendingState) {
      setGame(new Chess(pendingState.fen));
      setMoves(pendingState.moves);
      setPlayerColor(pendingState.playerColor);
      setResigned(pendingState.resigned);
    }
    setShowContinuePrompt(false);
    setPendingState(null);
  };

  /**
   * Handles color selection and, if black, triggers the computer's first move.
   */
  const handleChooseColor = (color: "w" | "b") => {
    setPlayerColor(color);
    setMoves([]);
    setResigned(false);
    if (color === "b") {
      setTimeout(async () => {
        const gameCopy = new Chess();
        const moveStr = await getComputerMove(gameCopy.fen(), skillLevel);
        let moveObj;
        if (moveStr) {
          moveObj = gameCopy.move({
            from: moveStr.slice(0, 2),
            to: moveStr.slice(2, 4),
            promotion: "q",
          });
        }
        setGame(gameCopy);
        setMoves([
          {
            moveNumber: 1,
            white: moveObj?.san,
          },
        ]);
      }, 300);
    } else {
      setGame(new Chess());
    }
  };

  /** Handles downloading the PGN of the current game. */
  const handleDownloadPGN = () => {
    const pgn = generatePGN(
      moves,
      playerColor,
      skillLevel,
      getGameResult(resigned, playerColor, game)
    );
    downloadPGN(pgn);
  };

  return (
    <div className="h-full min-h-screen flex items-center justify-center">
      <div className="flex justify-center bg-gray-800 rounded-lg p-4 min-w-[800px] relative ">
        {showContinuePrompt && (
          <ContinuePrompt
            onContinue={handleContinueGame}
            onNewGame={handleNewGame}
          />
        )}

        {(resigned || game.isGameOver() || game.isDraw()) && (
          <GameOverMessage
            message={getGameOverMessage(resigned, playerColor, game)}
          />
        )}

        {playerColor === null ? (
          <GameSetting
            onChoose={handleChooseColor}
            skillLevel={skillLevel}
            setSkillLevel={setSkillLevel}
          />
        ) : (
          <>
            <div className="w-full md:w-[600px] max-w-full h-[60vw] max-h-[80vw] md:h-[600px] flex-shrink-0 min-w-0 mb-4 md:mb-0">
              <Chessboard
                id="PlayVsRandom"
                position={game.fen()}
                onPieceDrop={onDrop}
                boardOrientation={playerColor === "w" ? "white" : "black"}
                customBoardStyle={{
                  borderRadius: "4px",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                }}
                snapToCursor={true}
                arePremovesAllowed={true}
              />
            </div>
            <div className="w-full md:w-auto min-w-0 max-h-60 overflow-y-auto md:max-h-none">
              <MoveListSidebar
                moves={moves}
                resigned={resigned}
                gameOver={game.isGameOver() || game.isDraw()}
                onResign={handleResign}
                onNewGame={handleNewGame}
                downloadPGN={handleDownloadPGN}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComputerGamePage;
