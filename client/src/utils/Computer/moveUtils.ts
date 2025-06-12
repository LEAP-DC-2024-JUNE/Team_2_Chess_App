import { Move } from "chess.js";

export type MoveRow = { moveNumber: number; white?: string; black?: string };

export const updateMoves = (prev: MoveRow[], move: Move): MoveRow[] => {
  const newMoves = [...prev];
  if (move.color === "w") {
    if (
      newMoves.length === 0 ||
      (newMoves[newMoves.length - 1].white &&
        newMoves[newMoves.length - 1].black)
    ) {
      newMoves.push({ moveNumber: newMoves.length + 1, white: move.san });
    } else {
      newMoves[newMoves.length - 1].white = move.san;
    }
  } else {
    if (newMoves.length === 0) {
      newMoves.push({ moveNumber: 1, black: move.san });
    } else {
      newMoves[newMoves.length - 1].black = move.san;
    }
  }
  return newMoves;
};
