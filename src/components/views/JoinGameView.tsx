import { Warning } from "../shared/Warning";
import type { GameContextType } from "../../hooks/useGameState";

interface JoinGameViewProps {
  gameState: GameContextType;
}

export const JoinGameView = ({ gameState }: JoinGameViewProps) => {
  const {
    gameInfo,
    warningMessage,
    warningType,
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
      setWarningMessage("Invalid contract address format. Please enter a valid Ethereum address.");
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

      {gameInfo && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          width: '75%',
          margin: '20px auto 0',
          textAlign: 'center'
        }}>
          <h4>Contract Information:</h4>
          <div><strong>Contract Address:</strong> {gameInfo.contractAddress}</div>
          <div><strong>Stake Amount:</strong> {gameInfo.stake} ETH</div>
          <div><strong>Player 2 Move:</strong> {gameInfo.c2 > 0 ? `Move ${gameInfo.c2}` : 'Not played yet'}</div>
          <div><strong>Player 1 Commitment:</strong> {gameInfo.c1Hash ? 'Committed' : 'Not committed'}</div>
          <div><strong>Last Action:</strong> {new Date(Number(gameInfo.lastAction) * 1000).toLocaleString()}</div>
          <div><strong>Timeout:</strong> {gameInfo.timeout} seconds</div>
          <div style={{ 
            color: gameInfo.playerRole ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginTop: '10px',
            padding: '10px',
            backgroundColor: gameInfo.playerRole ? '#d4edda' : '#f8d7da',
            borderRadius: '4px'
          }}>
            Status: {gameInfo.playerRole ? `You are ${gameInfo.playerRole === 'player1' ? 'Player 1' : 'Player 2'}` : 'Player role cannot be determined - ABI mismatch detected'}
          </div>
        </div>
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
