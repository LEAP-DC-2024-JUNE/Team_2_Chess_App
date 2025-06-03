import { getDatabasePool } from "../utils/dbSingleton.js";
export async function createGameRecord(
  gameId,
  whitePlayerId,
  blackPlayerId,
  initialFen
) {
  const pool = getDatabasePool();
  try {
    const [result] = await pool.execute(
      "INSERT INTO Games (game_id, white_player_id, black_player_id, fen, pgn, status) VALUES (?, ?, ?, ?, ?, ?)",
      [gameId, whitePlayerId, blackPlayerId, initialFen, "", "ongoing"]
    );
    console.log(`Game record created in DB for gameId: ${gameId}`);
    return result;
  } catch (error) {
    console.error("Error creating game record:", error);
    throw error;
  }
}
export async function updateGameFenAndPgn(gameId, newFen, newPgn) {
  const pool = getDatabasePool();
  try {
    const [result] = await pool.execute(
      "UPDATE Games SET fen = ?, pgn = ? WHERE game_id = ?",
      [newFen, newPgn, gameId]
    );
    return result;
  } catch (error) {
    console.error("Error updating game FEN/PGN:", error);
    throw error;
  }
}

export async function endGameRecord(gameId, result) {
  const pool = getDatabasePool();
  try {
    const [dbResult] = await pool.execute(
      "UPDATE Games SET end_time = CURRENT_TIMESTAMP, result = ?, status = 'finished' WHERE game_id = ?",
      [result, gameId]
    );
    console.log(
      `Game record ended in DB for gameId: ${gameId}, Result: ${result}`
    );
    return dbResult;
  } catch (error) {
    console.error("Error ending game record:", error);
    throw error;
  }
}

export async function getGameRecord(gameId) {
  const pool = getDatabasePool();
  try {
    const [rows] = await pool.execute(
      "SELECT game_id, pgn, fen, white_player_id, black_player_id, status FROM Games WHERE game_id = ?",
      [gameId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error fetching game record:", error);
    throw error;
  }
}
