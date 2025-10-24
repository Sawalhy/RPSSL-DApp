import type { GameContextType } from "../../hooks/useGameState";
import { moveNames } from "../../constants/moves";

interface WinLoseViewProps {
  gameState: GameContextType;
  isWin: boolean;
  player: 'player1' | 'player2';
}

export const WinLoseView = ({ gameState, isWin, player }: WinLoseViewProps) => {
  const {
    gameInfo,
    selectedMove,
    setCurrentView
  } = gameState;

  const player1Move = gameInfo?.c1 > 0 ? moveNames[gameInfo.c1] : 'Unknown';
  const player2Move = gameInfo?.c2 > 0 ? moveNames[gameInfo.c2] : 'Unknown';
  
  // For the current player, use selectedMove if available, otherwise use the stored move
  const currentPlayerMove = player === 'player1' 
    ? (selectedMove > 0 ? moveNames[selectedMove] : player1Move)
    : (selectedMove > 0 ? moveNames[selectedMove] : player2Move);
  const opponentMove = player === 'player1' ? player2Move : player1Move;

  const handleNewGame = () => {
    setCurrentView('landing');
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>
        {isWin ? 'You Won!' : 'You Lost!'}
      </h1>
      
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
