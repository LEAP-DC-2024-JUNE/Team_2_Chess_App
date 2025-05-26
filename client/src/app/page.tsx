import ChessboardContainer from "@/components/ChessboardContainer";
import ChessGame from "../components/chessGame";
const HomePage = () => {
  return (
    <div className="w-full flex justify-center">
      <ChessboardContainer />
      <ChessGame />
    </div>
  );
};

export default HomePage;
