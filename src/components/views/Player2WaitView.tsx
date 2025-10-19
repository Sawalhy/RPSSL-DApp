import { Warning } from "../shared/Warning";
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
    warningMessage,
    warningType,
    setWarningMessage,
    checkGameStatus,
    callTimeout
  } = gameState;

  return (
    <div>
      <h3>Player 2 - Waiting for Player 1</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={checkGameStatus}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Check Game State
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
        <p>You played: <strong>Move {selectedMove}</strong></p>
        <p>Waiting for Player 1 to reveal their move...</p>
      </div>

      {warningMessage && (
        <Warning 
          message={warningMessage} 
          type={warningType} 
          onClose={() => setWarningMessage("")}
        />
      )}
    </div>
  );
};
