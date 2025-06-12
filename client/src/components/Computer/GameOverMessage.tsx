import React from "react";

const GameOverMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center pointer-events-none absolute w-full h-full z-10">
    <div className="relative flex items-center justify-center">
      <div className="px-8 py-6 bg-gray-900 rounded-lg text-white text-3xl font-bold border-4 border-green-500">
        {message}
      </div>
    </div>
  </div>
);

export default GameOverMessage;
