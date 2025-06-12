import React from "react";
import { MoveRow } from "@/utils/Computer";

interface MoveListSidebarProps {
  moves: MoveRow[];
  resigned: boolean;
  gameOver: boolean;
  onResign: () => void;
  onNewGame: () => void;
  downloadPGN: () => void;
}

const MoveListSidebar: React.FC<MoveListSidebarProps> = ({
  moves,
  resigned,
  gameOver,
  onResign,
  onNewGame,
  downloadPGN,
}) => (
  <div className="w-64 h-[600px] ml-8 flex flex-col gap-4">
    <h2 className="text-2xl font-bold">Move List</h2>
    <div className="flex-1 overflow-y-auto bg-gray-700 rounded-lg p-4">
      <div className="grid grid-cols-[32px_1fr_1fr] gap-2 text-sm">
        <div className="font-bold">#</div>
        <div className="font-bold">White</div>
        <div className="font-bold">Black</div>
        {moves.length === 0 ? (
          <div className="col-span-3 text-gray-400 py-2">No moves yet</div>
        ) : (
          moves.map((move) => (
            <React.Fragment key={move.moveNumber}>
              <div>{move.moveNumber}</div>
              <div>{move.white || ""}</div>
              <div>{move.black || ""}</div>
            </React.Fragment>
          ))
        )}
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <button
        className="w-full bg-red-500 hover:opacity-75 text-white font-bold py-2 px-4 rounded-lg cursor-pointer"
        onClick={onResign}
        disabled={resigned || gameOver}
      >
        {resigned ? "You Resigned" : "Resign"}
      </button>
      {(resigned || gameOver) && (
        <button
          className="w-full bg-green-500 hover:opacity-75 text-white font-bold py-2 px-4 rounded-lg cursor-pointer"
          onClick={onNewGame}
        >
          New Game
        </button>
      )}
      <button
        className="w-full bg-blue-600 hover:opacity-75 text-white font-bold py-2 px-4 rounded-lg cursor-pointer"
        onClick={downloadPGN}
      >
        Download PGN
      </button>
    </div>
  </div>
);

export default MoveListSidebar;
