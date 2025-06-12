import React from "react";

interface GameSettingProps {
  onChoose: (color: "w" | "b") => void;
  skillLevel: number;
  setSkillLevel: (level: number) => void;
}

const GameSetting: React.FC<GameSettingProps> = ({
  onChoose,
  skillLevel,
  setSkillLevel,
}) => (
  <div className="flex flex-col gap-10 items-center justify-center w-[480px] h-[600px] bg-gray-800 rounded-lg">
    <div className="w-full flex flex-col gap-4 items-center">
      <label className="text-white font-bold text-2xl" htmlFor="skill-slider">
        Difficulty: {skillLevel}
      </label>
      <div className="flex flex-col gap-1">
        <input
          id="skill-slider"
          type="range"
          min={0}
          max={20}
          value={skillLevel}
          onChange={(e) => setSkillLevel(Number(e.target.value))}
          className="w-72 accent-gray-500 cursor-pointer"
        />
        <div className="flex justify-between w-full text-lg text-gray-300">
          <p>Easy</p>
          <p>Hard</p>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-8 items-center">
      <h2 className="text-2xl font-bold text-white">Choose your color</h2>
      <div className="flex gap-8 text-xl">
        <button
          className="bg-white text-black font-bold py-4 px-8 rounded-lg hover:bg-green-500 hover:text-white border-2 border-gray-500 cursor-pointer"
          onClick={() => onChoose("w")}
        >
          Play as White
        </button>
        <button
          className="bg-black text-white font-bold py-4 px-8 rounded-lg hover:bg-green-500 hover:text-white border-2 border-gray-500 cursor-pointer"
          onClick={() => onChoose("b")}
        >
          Play as Black
        </button>
      </div>
    </div>
  </div>
);

export default GameSetting;
