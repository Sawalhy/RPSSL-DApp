import { Timer } from "../shared/Timer";
import type { GameContextType } from "../../hooks/useGameState";

interface Player2WaitViewProps {
  gameState: GameContextType;
}

export const Player2WaitView = ({ gameState }: Player2WaitViewProps) => {
  const {
    timeLeft,
    isTimerActive,
    callTimeout
  } = gameState;
  
  // Calculate if timeout button should be enabled
  const canCallTimeout = !isTimerActive || timeLeft <= 0;

  return (
    <div>
      <h3>Player 2 - Waiting for Player 1</h3>
      
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
          title="Player 1's Reveal Timer"
          subtitle="Time for Player 1 to reveal"
        />
      )}

    </div>
  );
};
