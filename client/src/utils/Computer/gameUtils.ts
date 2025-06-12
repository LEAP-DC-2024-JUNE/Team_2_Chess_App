import { Chess } from "chess.js";

export const getGameResult = (
  resigned: boolean,
  playerColor: "w" | "b" | null,
  game: Chess
): string => {
  if (resigned) return playerColor === "w" ? "0-1" : "1-0";
  if (game.isCheckmate()) return game.turn() === "w" ? "0-1" : "1-0";
  if (game.isDraw() || game.isStalemate()) return "1/2-1/2";
  return "*";
};

export const getGameOverMessage = (
  resigned: boolean,
  playerColor: "w" | "b" | null,
  game: Chess
): string => {
  if (resigned) return "You resigned. You lost!";
  if (game.isCheckmate()) {
    const playerLost = game.turn() === playerColor;
    return playerLost ? "Checkmate! You lost!" : "Checkmate! You won!";
  }
  if (game.isDraw() || game.isStalemate()) return "Draw! Game over!";
  return "";
};

export const getIsGameOver = (game: Chess, resigned: boolean) =>
  resigned || game.isGameOver() || game.isDraw();
