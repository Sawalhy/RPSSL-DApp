import type { GameInfo, GameContextType } from "../../hooks/useGameState";
import { moveNames } from "../../constants/moves";

interface GameInfoDisplayProps {
  gameInfo: GameInfo;
  gameState: GameContextType;
}

export const GameInfoDisplay = ({ 
  gameInfo,
  gameState
}: GameInfoDisplayProps) => {
  const { selectedMove } = gameState;
  
  // Determine current player's move and opponent's move
  const currentPlayerMove = selectedMove > 0 ? moveNames[selectedMove] : 'Not selected';
  const opponentMove = gameInfo.playerRole === 'player1' 
    ? (gameInfo.c2 > 0 ? moveNames[gameInfo.c2] : 'Not played yet')
    : (gameInfo.c1 > 0 ? moveNames[gameInfo.c1] : 'Not revealed yet');

  return (
    <div style={{
      marginTop: '20px',
      padding: '10px',
      border: '1px solid #000',
      width: '75%',
      margin: '20px auto 0',
      textAlign: 'center'
    }}>
      <h4>Game Information</h4>
      <div><strong>Contract Address:</strong> {gameInfo.contractAddress}</div>
      <div><strong>Stake Amount:</strong> {gameInfo.originalStake || gameInfo.stake} ETH</div>
      <div><strong>Player 1:</strong> {gameInfo.j1Address}</div>
      <div><strong>Player 2:</strong> {gameInfo.j2Address}</div>
      <div style={{ marginTop: '10px', padding: '8px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
        <div><strong>Your Move:</strong> {currentPlayerMove}</div>
        <div><strong>Opponent's Move:</strong> {opponentMove}</div>
      </div>
      <div style={{ fontSize: '12px', marginTop: '10px', fontStyle: 'italic' }}>
        Game status refreshes automatically every 2 seconds
      </div>
    </div>
  );
};
