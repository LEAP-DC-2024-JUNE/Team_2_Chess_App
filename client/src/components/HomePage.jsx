"use client";
import chessimage from "../../public/chessimagee.avif";
import { useRouter } from "next/navigation";
export const HomePage = () => {
  const router = useRouter();
  return (
    <div className="flex justify-evenly">
      <div className="px-5 py-5 ">
        <img src={chessimage.src} className="w-full h-full" alt="LoginImage" />
      </div>
      <div className=" flex flex-col gap-8 justify-center items-center">
        <div
          className="bg-green-700 px-10 py-5 rounded-2xl hover:cursor-pointer hover:opacity-90 "
          onClick={() => router.push("/login")}
        >
          <p className="text-2xl font-bold text-zinc-200">Play Online</p>
          <p className="text-xl text-zinc-200">Play with your friends</p>
        </div>
        <div className="bg-gray-300 px-10 py-5 rounded-2xl hover:cursor-pointer hover:opacity-90">
          <p className="text-2xl font-bold ">Play Computer</p>
          <p className="text-xl">Play vs trained bots</p>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
