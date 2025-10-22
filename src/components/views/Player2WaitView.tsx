import { Timer } from "../shared/Timer";
import type { GameContextType } from "../../hooks/useGameState";

interface Player2WaitViewProps {
  gameState: GameContextType;
}

export const Player2WaitView = ({ gameState }: Player2WaitViewProps) => {
  const {
    gameInfo,
    selectedMove,
    timeLeft,
    isTimerActive,
    callTimeout
  } = gameState;

  const moves = ['', 'Rock', 'Paper', 'Scissors', 'Spock', 'Lizard'];
  const player2Move = selectedMove > 0 ? moves[selectedMove] : 'Unknown';
  
  // Calculate if timeout button should be enabled
  const canCallTimeout = !isTimerActive || timeLeft <= 0;
  
  // Debug logging
  console.log("Player2WaitView - Timer state:", { timeLeft, isTimerActive, canCallTimeout });

  return (
    <div>
      <h3>Player 2 - Waiting for Player 1</h3>
      
      <div style={{ marginBottom: '20px' }}>
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
          subtitle="Time for Player 1 to reveal"
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
        <h4>Move Already Played</h4>
        <p>You played: <strong>{player2Move}</strong></p>
        <p>Waiting for Player 1 to reveal their move...</p>
        
        {gameInfo?.c2 > 0 && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p><strong>Game Status:</strong></p>
            <p>• Player 2 Move: <strong>{moves[gameInfo.c2]}</strong></p>
            <p>• Player 1 Move: <strong>Hidden (committed)</strong></p>
          </div>
        )}
      </div>

    </div>
  );
};
