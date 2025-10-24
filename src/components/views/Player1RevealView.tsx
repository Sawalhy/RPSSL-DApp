import { Timer } from "../shared/Timer";
import type { GameContextType } from "../../hooks/useGameState";

interface Player1RevealViewProps {
  gameState: GameContextType;
}

export const Player1RevealView = ({ gameState }: Player1RevealViewProps) => {
  const {
    timeLeft,
    isTimerActive,
    callTimeout,
    revealMove
  } = gameState;
  
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
          subtitle="Time to reveal your move"
        />
      )}

    </div>
  );
};
