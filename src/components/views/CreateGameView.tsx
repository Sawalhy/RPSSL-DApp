import { MoveSelector } from "../shared/MoveSelector";
import { Timer } from "../shared/Timer";
import { WalletConnectionPrompt } from "../shared/WalletConnectionPrompt";
import { AddressInput } from "../shared/AddressInput";
import type { GameContextType } from "../../hooks/useGameState";
import { useWallet } from "../../hooks/useWallet";

interface CreateGameViewProps {
  gameState: GameContextType;
}

export const CreateGameView = ({ gameState }: CreateGameViewProps) => {
  const {
    gameInfo,
    selectedMove,
    stakeAmount,
    setGameInfo,
    setSelectedMove,
    setStakeAmount,
    deployContract,
    setWarningMessage,
    setWarningType
  } = gameState;

  const { isConnected } = useWallet();

  const handleDeployContract = async () => {
    if (!isConnected) {
      setWarningMessage("Please connect your wallet first");
      setWarningType('error');
      return;
    }
    await deployContract();
  };

  return (
    <div>
      <h3>Create New Game</h3>
      
      {!isConnected ? (
        <WalletConnectionPrompt 
          title="Connect Your Wallet"
          description="Please connect your MetaMask wallet to create a game."
        />
      ) : (
        <>
          <AddressInput
            id="player2Address"
            label="Player 2's Address"
            value={gameInfo?.j2Address || ""}
            onChange={(value) => setGameInfo({ ...gameInfo!, j2Address: value })}
          />

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
              onClick={handleDeployContract}
              style={{
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              Start Game
            </button>
          </div>
        </>
      )}
    </div>
  );
};
