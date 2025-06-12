import React from "react";

interface ContinuePromptProps {
  onContinue: () => void;
  onNewGame: () => void;
}

const ContinuePrompt: React.FC<ContinuePromptProps> = ({
  onContinue,
  onNewGame,
}) => (
  <div className="flex items-center justify-center bg-gray-800 rounded-lg absolute w-full h-full z-10">
    <div className="flex flex-col gap-4 items-center bg-gray-900 p-8 rounded-lg ">
      <h2 className="text-2xl font-bold text-white">
        Continue your previous game?
      </h2>
      <div className="flex gap-4 text-white font-bold">
        <button
          className="bg-green-500 hover:opacity-75 py-2 px-6 rounded cursor-pointer"
          onClick={onContinue}
        >
          Continue
        </button>
        <button
          className="bg-red-500 hover:opacity-75 py-2 px-6 rounded cursor-pointer"
          onClick={onNewGame}
        >
          New Game
        </button>
      </div>
    </div>
  </div>
);

export default ContinuePrompt;
