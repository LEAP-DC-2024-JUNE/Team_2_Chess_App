import { MoveRow } from "./moveUtils";

export const generatePGN = (
  moves: MoveRow[],
  playerColor: "w" | "b" | null,
  skillLevel: number,
  result: string = "*"
) => {
  const date = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(
    date.getDate()
  )}`;
  let pgn = `[Event "Chess vs Computer"]
[Site "team-chess-app.vercel.app"]
[Date "${dateStr}"]
[White "${playerColor === "w" ? "Player" : "Computer"}"]
[Black "${playerColor === "b" ? "Player" : "Computer"}"]
[Level "${skillLevel}"]
[Result "${result}"]

`;
  let movesStr = "";
  moves.forEach((row) => {
    movesStr += `${row.moveNumber}.`;
    if (row.white) movesStr += ` ${row.white}`;
    if (row.black) movesStr += ` ${row.black}`;
    movesStr += " ";
  });
  pgn += movesStr.trim() + ` ${result}`;
  return pgn;
};

export const downloadPGN = (pgn: string, filename = "game.pgn") => {
  const blob = new Blob([pgn], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
