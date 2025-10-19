import { MoveSelector } from "../shared/MoveSelector";
import { Warning } from "../shared/Warning";
import { Timer } from "../shared/Timer";
import type { GameContextType } from "../../hooks/useGameState";

interface Player2PlayViewProps {
  gameState: GameContextType;
}

export const Player2PlayView = ({ gameState }: Player2PlayViewProps) => {
  const {
    gameInfo,
    selectedMove,
    timeLeft,
    isTimerActive,
    warningMessage,
    warningType,
    setSelectedMove,
    setWarningMessage,
    playMove
  } = gameState;

  return (
    <div>
      <h3>Player 2 - Play Your Move</h3>
      
      <MoveSelector 
        selectedMove={selectedMove}
        onMoveSelect={setSelectedMove}
      />

      <div style={{ marginBottom: '20px' }}>
        <label>Stake Amount: {gameInfo?.stake} ETH</label>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
        <button 
          onClick={playMove}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Play Move
        </button>
      </div>

      {isTimerActive && (
        <Timer 
          timeLeft={timeLeft}
          isActive={isTimerActive}
          title="Your Turn Timer"
          subtitle="Time to play your move"
        />
      )}

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
