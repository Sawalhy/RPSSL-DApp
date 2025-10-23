import { useWallet } from "../../hooks/useWallet";

interface WalletConnectionPromptProps {
  title?: string;
  description?: string;
}

export const WalletConnectionPrompt = ({ 
  title = "Connect Your Wallet",
  description = "Please connect your MetaMask wallet to continue."
}: WalletConnectionPromptProps) => {
  const { connectWallet, isConnecting } = useWallet();

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h4>{title}</h4>
      <p>{description}</p>
      <button 
        onClick={connectWallet}
        disabled={isConnecting}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#f0f0f0', 
          border: '1px solid #ccc',
          borderRadius: '5px',
          cursor: isConnecting ? 'not-allowed' : 'pointer'
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
};
