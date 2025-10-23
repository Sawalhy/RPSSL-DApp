import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function useWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()

  const connectWallet = () => {
    const connector = connectors[0] // MetaMask connector
    if (connector) {
      connect({ connector })
    }
  }

  return {
    address,
    isConnected,
    chainId,
    connectWallet,
    disconnect,
    isConnecting: isPending,
    error,
  }
}
