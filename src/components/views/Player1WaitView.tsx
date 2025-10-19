import { Warning } from "../shared/Warning";
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
    warningMessage,
    warningType,
    setWarningMessage,
    checkGameStatus,
    callTimeout
  } = gameState;

  return (
    <div>
      <h3>Player 1 - Waiting for Player 2</h3>
      
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

        {gameInfo?.c2 && gameInfo.c2 > 0 && (
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
        )}
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
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px'
      }}>
        <h4>Game Status:</h4>
        <div>Player 2 Move: {gameInfo?.c2 && gameInfo.c2 > 0 ? `Move ${gameInfo.c2}` : 'Not played yet'}</div>
        <div>Stake Amount: {gameInfo?.stake} ETH</div>
        <div>Contract Address: {gameInfo?.contractAddress}</div>
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
