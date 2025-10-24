import type { GameContextType } from "../../hooks/useGameState";
import { useWallet } from "../../hooks/useWallet";
import { WalletConnectionPrompt } from "../shared/WalletConnectionPrompt";
import { AddressInput } from "../shared/AddressInput";

interface JoinGameViewProps {
  gameState: GameContextType;
}

export const JoinGameView = ({ gameState }: JoinGameViewProps) => {
  const {
    gameInfo,
    setGameInfo,
    setWarningMessage,
    checkGameStatus
  } = gameState;

  const { isConnected } = useWallet();

  const handleJoinGame = async () => {
    if (!isConnected) {
      setWarningMessage("Please connect your wallet first");
      return;
    }

    if (!gameInfo?.contractAddress) {
      setWarningMessage("Please enter a contract address");
      return;
    }
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(gameInfo.contractAddress)) {
      setWarningMessage("Invalid contract address format");
      return;
    }
    
    await checkGameStatus();
  };

  return (
    <div>
      <h3>Join Existing Game</h3>
      
      {!isConnected ? (
        <WalletConnectionPrompt 
          title="Connect Your Wallet"
          description="Please connect your MetaMask wallet to join a game."
        />
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <AddressInput
            id="contractAddress"
            label="Contract Address"
            value={gameInfo?.contractAddress || ""}
            onChange={(value) => setGameInfo({ ...gameInfo!, contractAddress: value })}
          />
          <button 
            onClick={handleJoinGame}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Join Game
          </button>
        </div>
      )}
    </div>
  );
};
