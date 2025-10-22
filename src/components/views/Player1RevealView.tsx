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
          disabled={isTimerActive}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: isTimerActive ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isTimerActive ? 'not-allowed' : 'pointer',
            opacity: isTimerActive ? 0.6 : 1
          }}
        >
          Call Timeout
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
        <p><strong>Your Committed Move:</strong> {selectedMove > 0 ? `Move ${selectedMove}` : 'Not available'}</p>
        <p><strong>Salt:</strong> {generatedSalt ? generatedSalt.substring(0, 10) + '...' : 'Not available'}</p>
      </div>
    </div>
  );
};
