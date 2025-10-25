import type { GameContextType } from "../../hooks/useGameState";
import { moveNames } from "../../constants/moves";

interface TieViewProps {
  gameState: GameContextType;
}

export const TieView = ({ gameState }: TieViewProps) => {
  const {
    gameInfo,
    selectedMove,
    setCurrentView
  } = gameState;

  // Use the same logic as GameInfoDisplay for consistency
  const currentPlayerMove = selectedMove > 0 ? moveNames[selectedMove] : 'Unknown';
  const opponentMove = gameInfo?.playerRole === 'player1' 
    ? (gameInfo?.c2 > 0 ? moveNames[gameInfo.c2] : 'Unknown')
    : (gameInfo?.c1 > 0 ? moveNames[gameInfo.c1] : 'Unknown');

  const handleNewGame = () => {
    setCurrentView('landing');
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>It's a Tie!</h1>
      
      <div style={{
        marginBottom: '30px',
        padding: '10px',
        border: '1px solid #000',
        maxWidth: '500px',
        margin: '20px auto'
      }}>
        <h3>Game Summary</h3>
        <p><strong>Player 1:</strong> {gameInfo?.j1Address}</p>
        <p><strong>Player 2:</strong> {gameInfo?.j2Address}</p>
        <p><strong>Stake:</strong> {gameInfo?.originalStake || gameInfo?.stake} ETH</p>
        <p><strong>Contract:</strong> {gameInfo?.contractAddress}</p>
        
        <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #000' }}>
          <h4>Moves Played</h4>
          <p><strong>Your Move:</strong> {currentPlayerMove}</p>
          <p><strong>Opponent's Move:</strong> {opponentMove}</p>
        </div>
        
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f8ff', border: '1px solid #000' }}>
          <p><strong>Result:</strong> Both players get their stake back!</p>
        </div>
      </div>

      <button
        onClick={handleNewGame}
        style={{
          padding: '10px 20px',
          cursor: 'pointer'
        }}
      >
        Play Again
      </button>

    </div>
  );
};
