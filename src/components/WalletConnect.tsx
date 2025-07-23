import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast'; 
import { ethers } from 'ethers'; 


// Extend the Window interface to include ethereum for MetaMask detection
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Define the props interface for WalletConnect
interface WalletConnectProps {
  onConnect: (address: string, provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) => void;
  onDisconnect: () => void; // Callback when wallet disconnects
  connected: boolean; // Prop indicating if wallet is currently connected (from parent)
  currentAddress: string | null; // Prop for the currently connected address (from parent)
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  connected,
  currentAddress,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  /**
   * Attempts to connect to the user's MetaMask wallet.
   * If successful, calls the onConnect prop with the connected address.
   */
  const connectWallet = async () => {
    console.log('Attempting to connect wallet...');

    if (typeof window.ethereum === 'undefined') {
      console.log('MetaMask not found');
      toast({
        variant: "destructive",
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this feature.",
      });
      return;
    }

    setIsConnecting(true);

    try {
      console.log('MetaMask detected, requesting accounts...');

      // Request accounts from MetaMask. This will prompt the user to connect if not already.
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('Connected accounts:', accounts);

      if (accounts.length > 0) {
        // Create provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // If accounts are successfully retrieved, call the onConnect callback
        onConnect(accounts[0], provider, signer);
        // Toast is now handled by the parent (Index.tsx) via onConnect callback
      } else {
        throw new Error('No accounts returned from MetaMask.');
      }
    } catch (error: any) {
      console.error('Connection error:', error);

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

  /**
   * Handles wallet disconnection.
   * Calls the onDisconnect prop.
   */
  const disconnectWallet = () => {
    // For MetaMask, there isn't a direct 'disconnect' API call that revokes permissions
    // from the dApp side. Disconnecting usually means clearing the dApp's internal state.
    // The user would typically disconnect from MetaMask itself.
    // However, we call onDisconnect to update the parent's state.
    onDisconnect();
    // Toast is now handled by the parent (Index.tsx) via onDisconnect callback
  };

  /**
   * useEffect hook to set up listeners for MetaMask account changes.
   * Also checks for already connected accounts on component mount.
   */
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      console.log('Setting up account change listener...');

      const handleAccountsChanged = async (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length > 0) {
          // Create provider and signer for account change
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          onConnect(accounts[0], provider, signer); // Account changed to a new one or reconnected
        } else {
          onDisconnect(); // All accounts disconnected
        }
      };

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Check if already connected on component mount
      window.ethereum.request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          console.log('Initial accounts check:', accounts);
          if (accounts.length > 0) {
            // Create provider and signer for initial connection
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            onConnect(accounts[0], provider, signer); // Already connected
          } else {
            onDisconnect(); // Not connected on mount
          }
        })
        .catch((error: any) => {
          console.error('Error checking initial accounts:', error);
          onDisconnect(); // Assume disconnected if error
        });

      // Cleanup function for the event listener
      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [onConnect, onDisconnect]); // Dependencies: ensure callbacks are always up-to-date

  return (
    <div className="flex items-center gap-4">
      {connected ? ( // Use the 'connected' prop to determine UI
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
