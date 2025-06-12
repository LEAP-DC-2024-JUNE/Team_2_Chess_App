import type { MoveRow } from "./moveUtils";

const LS_KEY = "chess_vs_computer_state";

export type GameState = {
  fen: string | undefined;
  moves: MoveRow[];
  playerColor: "w" | "b" | null;
  resigned: boolean;
};

export const loadGameState = (): GameState | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? (JSON.parse(saved) as GameState) : null;
  } catch {
    localStorage.removeItem(LS_KEY);
    return null;
  }
};

export const saveGameState = (state: GameState) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }
};

export const clearGameState = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LS_KEY);
  }
};
