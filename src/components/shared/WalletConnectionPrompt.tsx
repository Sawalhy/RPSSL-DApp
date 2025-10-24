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
    <div style={{
      marginTop: '20px',
      padding: '10px',
      border: '2px solid #007bff',
      borderRadius: '8px',
      width: '50%',
      margin: '20px auto 0',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        {title}
      </div>
      <div style={{ marginBottom: '10px', fontSize: '14px' }}>
        {description}
      </div>
      <button 
        onClick={connectWallet}
        disabled={isConnecting}
        style={{ 
          padding: '10px 20px',
          cursor: isConnecting ? 'not-allowed' : 'pointer'
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
};
