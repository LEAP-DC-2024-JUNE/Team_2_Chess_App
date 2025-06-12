import HomePage from "../components/HomePage";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
// 3c1d0e
const Home = () => {
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
            href={"/login"}
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
