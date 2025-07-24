import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  onConnect: (address: string, provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) => void;
  onDisconnect: () => void;
  connected: boolean;
  currentAddress: string | null;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  connected,
  currentAddress,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectWallet = async () => {

    if (typeof window.ethereum === 'undefined') {
      toast({
        variant: "destructive",
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this feature.",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });


      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        onConnect(accounts[0], provider, signer);
      } else {
        throw new Error('No accounts returned from MetaMask.');
      }
    } catch (error: any) {
      let errorMessage = "Failed to connect to MetaMask. Please try again.";
      if (error.code === 4001) {
        errorMessage = "Connection rejected by user.";
      } else if (error.code === -32002) {
        errorMessage = "Connection request already pending. Please check MetaMask.";
      }
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessage,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    onDisconnect();
  };

  useEffect(() => {

    // Check if window.ethereum exists before adding listeners
    if (typeof window.ethereum === 'undefined') {
      onDisconnect(); // Ensure disconnected state if MetaMask is not present
      return; // Exit early if no ethereum object
    }

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        onConnect(accounts[0], provider, signer);
      } else {
        onDisconnect();
      }
    };

    const handleChainChanged = (chainId: string) => {
      // Optional: You might want to re-check connection or prompt user to switch chain
      // For now, just logging. If chain changes to an unsupported one, it might implicitly disconnect.
      // A full dApp would often re-initialize ethers objects here or prompt for chain switch.
    };

    const handleConnect = (connectInfo: any) => {
      // This fires when MetaMask connects to a chain, not necessarily when accounts are exposed to dApp
    };

    const handleDisconnect = (error: any) => {
      onDisconnect(); // MetaMask explicitly disconnected
    };

    // Add listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('connect', handleConnect);
    window.ethereum.on('disconnect', handleDisconnect);


    // Initial check for already connected accounts
    window.ethereum.request({ method: 'eth_accounts' })
      .then(async (accounts: string[]) => {
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          onConnect(accounts[0], provider, signer);
        } else {
          onDisconnect();
        }
      })
      .catch((error: any) => {
        onDisconnect(); // Assume disconnected if error
      });

    // Cleanup function
    return () => {
      // --- FIX: Use a check for `window.ethereum` before removing listeners ---
      // This prevents errors if window.ethereum somehow becomes undefined during unmount
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
      // --- END FIX ---
    };
  }, [onConnect, onDisconnect]); // Dependencies: ensure callbacks are always up-to-date

  return (
    <div className="flex items-center gap-4">
      {connected ? (
        <div className="flex items-center gap-2 bg-accent/80 backdrop-blur-sm px-4 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-medium text-sm">
            {currentAddress ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : 'Connected'}
          </span>
          <Button
            onClick={disconnectWallet}
            className="ml-2 px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md"
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}
    </div>
  );
};
