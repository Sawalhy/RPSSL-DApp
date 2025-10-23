import { Timer } from "../shared/Timer";
import type { GameContextType } from "../../hooks/useGameState";

interface Player1WaitViewProps {
  gameState: GameContextType;
}

export const Player1WaitView = ({ gameState }: Player1WaitViewProps) => {
  const {
    timeLeft,
    isTimerActive,
    callTimeout
  } = gameState;

  // Calculate if timeout button should be enabled
  const canCallTimeout = !isTimerActive || timeLeft <= 0;

  return (
    <div>
      <h3>Player 1 - Waiting for Player 2</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={callTimeout}
          disabled={!canCallTimeout}
          style={{
            padding: '10px 20px',
            cursor: canCallTimeout ? 'pointer' : 'not-allowed'
          }}
        >
          {canCallTimeout ? 'Call Timeout' : 'Wait for Timer to Expire'}
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
