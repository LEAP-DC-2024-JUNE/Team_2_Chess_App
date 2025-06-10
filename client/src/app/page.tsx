// import ChessboardContainer from "@/components/ChessboardContainer";
// import ChessGame from "../components/chessGame";
import HomePage from "../components/HomePage";
import Header from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import Link from "next/link";
// 3c1d0e
const Home = () => {
  const test = () => {
    redirect("/login");
  };
  return (
    <div className="h-full flex items-center justify-center">
      <HomePage />
      <Card className="min-w-96 bg-gray-500 border-none text-white">
        <CardHeader>
          <CardTitle className="text-center text-4xl font-semibold">
            Menu
          </CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8">
          <Link
            href={"/online"}
            className="w-full bg-gray-300 text-black text-xl text-center font-bold py-8 rounded-lg hover:opacity-75 hover:bg-gray-300 cursor-pointer"
          >
            Play Online
          </Link>
          <Link
            href={"/computer"}
            className="w-full bg-gray-300 text-black text-xl text-center font-bold py-8 rounded-lg hover:opacity-75 hover:bg-gray-300 cursor-pointer"
          >
            Play with Computer
          </Link>
          <Link
            href={"/board"}
            className="w-full bg-gray-300 text-black text-xl text-center font-bold py-8 rounded-lg hover:opacity-75 hover:bg-gray-300 cursor-pointer"
          >
            Play on Same Device
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
