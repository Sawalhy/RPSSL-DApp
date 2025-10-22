import { Timer } from "../shared/Timer";
import type { GameContextType } from "../../hooks/useGameState";

interface Player1WaitViewProps {
  gameState: GameContextType;
}

export const Player1WaitView = ({ gameState }: Player1WaitViewProps) => {
  const {
    gameInfo,
    timeLeft,
    isTimerActive,
    callTimeout
  } = gameState;

  return (
    <div>
      <h3>Player 1 - Waiting for Player 2</h3>
      
      <div style={{ marginBottom: '20px' }}>
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
          title="Player 2's Turn Timer"
          subtitle="Time for Player 2 to play their move"
        />
      )}


    </div>
  );
};
