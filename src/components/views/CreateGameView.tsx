import { MoveSelector } from "../shared/MoveSelector";
import { Warning } from "../shared/Warning";
import { Timer } from "../shared/Timer";
import type { GameContextType } from "../../hooks/useGameState";

interface CreateGameViewProps {
  gameState: GameContextType;
}

export const CreateGameView = ({ gameState }: CreateGameViewProps) => {
  const {
    gameInfo,
    selectedMove,
    stakeAmount,
    warningMessage,
    warningType,
    setGameInfo,
    setSelectedMove,
    setStakeAmount,
    setWarningMessage,
    deployContract
  } = gameState;

  return (
    <div>
      <h3>Create New Game</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="player2Address">Player 2's Address:</label>
        <input
          id="player2Address"
          type="text"
          value={gameInfo?.j2Address || ""}
          onChange={(e) => setGameInfo({ ...gameInfo!, j2Address: e.target.value })}
          placeholder="0x..."
          style={{
            marginLeft: '10px',
            padding: '5px',
            width: '300px',
            fontFamily: 'monospace'
          }}
        />
      </div>

      <MoveSelector
        selectedMove={selectedMove}
        onMoveSelect={setSelectedMove}
      />

      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="stake">Stake Amount (ETH):</label>
        <input
          id="stake"
          type="number"
          step="0.0001"
          min="0"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="0.0001"
          style={{
            marginLeft: '10px',
            padding: '5px',
            width: '150px',
            fontFamily: 'monospace'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={deployContract}
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
          Start Game
        </button>
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
