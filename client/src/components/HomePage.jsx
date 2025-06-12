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
    </div>
  );
};
export default HomePage;
