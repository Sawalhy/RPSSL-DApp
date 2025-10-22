import { Warning } from "../shared/Warning";
import { Timer } from "../shared/Timer";
import type { GameContextType } from "../../hooks/useGameState";

interface Player1RevealViewProps {
  gameState: GameContextType;
}

export const Player1RevealView = ({ gameState }: Player1RevealViewProps) => {
  const {
    gameInfo,
    generatedSalt,
    selectedMove,
    timeLeft,
    isTimerActive,
    callTimeout,
    revealMove
  } = gameState;

  const moves = ['', 'Rock', 'Paper', 'Scissors', 'Spock', 'Lizard'];
  const player1Move = selectedMove > 0 ? moves[selectedMove] : 'Unknown';
  const player2Move = gameInfo?.c2 > 0 ? moves[gameInfo.c2] : 'Unknown';
  
  // Calculate if timeout button should be enabled
  const canCallTimeout = !isTimerActive || timeLeft <= 0;

  return (
    <div>
      <h3>Player 1 - Reveal Your Move</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={revealMove}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Reveal Move
        </button>

        <button 
          onClick={callTimeout}
          disabled={!canCallTimeout}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: canCallTimeout ? '#f44336' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canCallTimeout ? 'pointer' : 'not-allowed',
            opacity: canCallTimeout ? 1 : 0.6
          }}
        >
          {canCallTimeout ? 'Call Timeout' : 'Wait for Timer to Expire'}
        </button>
      </div>

      {isTimerActive && (
        <Timer 
          timeLeft={timeLeft}
          isActive={isTimerActive}
          title="Player 1's Reveal Timer"
          subtitle="Time to reveal your move"
        />
      )}

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '8px',
        color: '#155724'
      }}>
        <h4>Ready to Reveal</h4>
        <p>Player 2 has played their move. You can now reveal your move to determine the winner.</p>
        
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <p><strong>Game Status:</strong></p>
          <p>• Player 1 Move: <strong>{player1Move} (committed)</strong></p>
          <p>• Player 2 Move: <strong>{player2Move}</strong></p>
          <p>• Salt: <strong>{generatedSalt ? generatedSalt.substring(0, 10) + '...' : 'Not available'}</strong></p>
        </div>
      </div>
    </div>
  );
};
