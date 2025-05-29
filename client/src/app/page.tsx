// import ChessboardContainer from "@/components/ChessboardContainer";
import ChessGame from "../components/chessGame";
// 3c1d0e
const HomePage = () => {
  return (
    <div className="w-full min-h-screen bg-[#310d04] flex justify-center items-center">
      {/* <ChessboardContainer /> */}
      <ChessGame />
    </div>
  );
};

export default HomePage;
