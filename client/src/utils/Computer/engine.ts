/**
 * Calls Stockfish engine in a web worker and returns the best move in UCI format.
 * @param fen The FEN string of the current position
 * @param skillLevel The Stockfish skill level (0-20)
 */
export async function getComputerMove(
  fen: string,
  skillLevel = 10
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const STOCKFISH_PATH = "/stockfish/stockfish-17-single.js";
  const worker = new Worker(STOCKFISH_PATH);

  return new Promise((resolve) => {
    worker.onmessage = (event: MessageEvent) => {
      const line = typeof event.data === "string" ? event.data : "";
      if (line.startsWith("bestmove")) {
        const parts = line.split(" ");
        const bestMove = parts[1] !== "(none)" ? parts[1] : null;
        worker.terminate();
        resolve(bestMove);
      }
    };
    worker.postMessage("uci");
    worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
    worker.postMessage("isready");
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage("go depth 12");
  });
}
