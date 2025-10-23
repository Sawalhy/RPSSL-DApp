import type { GameContextType } from "../../hooks/useGameState";

interface JoinGameViewProps {
  gameState: GameContextType;
}

export const JoinGameView = ({ gameState }: JoinGameViewProps) => {
  const {
    gameInfo,
    setGameInfo,
    setWarningMessage,
    setWarningType,
    checkGameStatus
  } = gameState;

  const handleJoinGame = async () => {
    if (!gameInfo?.contractAddress) {
      setWarningMessage("Please enter a contract address");
      setWarningType('error');
      return;
    }
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(gameInfo.contractAddress)) {
      setWarningMessage("Invalid contract address format");
      setWarningType('error');
      return;
    }
    
    await checkGameStatus();
  };

  return (
    <div>
      <h3>Join Existing Game</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="contractAddress">Contract Address:</label>
        <input
          id="contractAddress"
          type="text"
          value={gameInfo?.contractAddress || ""}
          onChange={(e) => setGameInfo({ ...gameInfo!, contractAddress: e.target.value })}
          placeholder="0x..."
          style={{
            marginLeft: '10px',
            padding: '5px',
            width: '300px',
            fontFamily: 'monospace'
          }}
        />
        <button 
          onClick={handleJoinGame}
          style={{ marginLeft: '10px', padding: '5px 10px' }}
        >
          Join Game
        </button>
      </div>


    </div>
  );
};
