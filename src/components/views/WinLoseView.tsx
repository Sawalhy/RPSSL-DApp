import type { GameContextType } from "../../hooks/useGameState";

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

  const moves = ['', 'Rock', 'Paper', 'Scissors', 'Spock', 'Lizard'];
  const player1Move = selectedMove > 0 ? moves[selectedMove] : 'Unknown';
  const player2Move = gameInfo?.c2 > 0 ? moves[gameInfo.c2] : 'Unknown';

  const handleNewGame = () => {
    setCurrentView('landing');
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '20px',
        color: isWin ? '#4CAF50' : '#f44336'
      }}>
        {isWin ? '🎉' : '😞'}
      </div>
      
      <h1 style={{ 
        color: isWin ? '#4CAF50' : '#f44336',
        marginBottom: '20px'
      }}>
        {isWin ? 'You Won!' : 'You Lost!'}
      </h1>
      
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        maxWidth: '500px',
        margin: '0 auto 30px'
      }}>
        <h3>Game Summary</h3>
        <p><strong>Player 1:</strong> {gameInfo?.j1Address}</p>
        <p><strong>Player 2:</strong> {gameInfo?.j2Address}</p>
        <p><strong>Stake:</strong> {gameInfo?.originalStake || gameInfo?.stake} ETH</p>
        <p><strong>Contract:</strong> {gameInfo?.contractAddress}</p>
        
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
          <h4>Moves Played</h4>
          <p><strong>Player 1:</strong> {player1Move}</p>
          <p><strong>Player 2:</strong> {player2Move}</p>
        </div>
      </div>

      <button
        onClick={handleNewGame}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0, 123, 255, 0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        Play Again
      </button>

    </div>
  );
};
