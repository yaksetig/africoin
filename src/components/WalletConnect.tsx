// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { useToast } from '@/hooks/use-toast'; 
// import { ethers } from 'ethers'; 


// // Extend the Window interface to include ethereum for MetaMask detection
// declare global {
//   interface Window {
//     ethereum?: any;
//   }
// }

// // Define the props interface for WalletConnect
// interface WalletConnectProps {
//   onConnect: (address: string, provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) => void;
//   onDisconnect: () => void; // Callback when wallet disconnects
//   connected: boolean; // Prop indicating if wallet is currently connected (from parent)
//   currentAddress: string | null; // Prop for the currently connected address (from parent)
// }

// export const WalletConnect: React.FC<WalletConnectProps> = ({
//   onConnect,
//   onDisconnect,
//   connected,
//   currentAddress,
// }) => {
//   const [isConnecting, setIsConnecting] = useState(false);
//   const { toast } = useToast();

//   /**
//    * Attempts to connect to the user's MetaMask wallet.
//    * If successful, calls the onConnect prop with the connected address.
//    */
//   const connectWallet = async () => {
//     console.log('Attempting to connect wallet...');

//     if (typeof window.ethereum === 'undefined') {
//       console.log('MetaMask not found');
//       toast({
//         variant: "destructive",
//         title: "MetaMask Not Found",
//         description: "Please install MetaMask to use this feature.",
//       });
//       return;
//     }

//     setIsConnecting(true);

//     try {
//       console.log('MetaMask detected, requesting accounts...');

//       // Request accounts from MetaMask. This will prompt the user to connect if not already.
//       const accounts: string[] = await window.ethereum.request({
//         method: 'eth_requestAccounts'
//       });

//       console.log('Connected accounts:', accounts);

//       if (accounts.length > 0) {
//         // Create provider and signer
//         const provider = new ethers.BrowserProvider(window.ethereum);
//         const signer = await provider.getSigner();
        
//         // If accounts are successfully retrieved, call the onConnect callback
//         onConnect(accounts[0], provider, signer);
//         // Toast is now handled by the parent (Index.tsx) via onConnect callback
//       } else {
//         throw new Error('No accounts returned from MetaMask.');
//       }
//     } catch (error: any) {
//       console.error('Connection error:', error);

//       let errorMessage = "Failed to connect to MetaMask. Please try again.";

//       if (error.code === 4001) {
//         errorMessage = "Connection rejected by user.";
//       } else if (error.code === -32002) {
//         errorMessage = "Connection request already pending. Please check MetaMask.";
//       }

//       toast({
//         variant: "destructive",
//         title: "Connection Failed",
//         description: errorMessage,
//       });
//     } finally {
//       setIsConnecting(false);
//     }
//   };

//   /**
//    * Handles wallet disconnection.
//    * Calls the onDisconnect prop.
//    */
//   const disconnectWallet = () => {
//     // For MetaMask, there isn't a direct 'disconnect' API call that revokes permissions
//     // from the dApp side. Disconnecting usually means clearing the dApp's internal state.
//     // The user would typically disconnect from MetaMask itself.
//     // However, we call onDisconnect to update the parent's state.
//     onDisconnect();
//     // Toast is now handled by the parent (Index.tsx) via onDisconnect callback
//   };

//   /**
//    * useEffect hook to set up listeners for MetaMask account changes.
//    * Also checks for already connected accounts on component mount.
//    */
//   useEffect(() => {
//     if (typeof window.ethereum !== 'undefined') {
//       console.log('Setting up account change listener...');

//       const handleAccountsChanged = async (accounts: string[]) => {
//         console.log('Accounts changed:', accounts);
//         if (accounts.length > 0) {
//           // Create provider and signer for account change
//           const provider = new ethers.BrowserProvider(window.ethereum);
//           const signer = await provider.getSigner();
//           onConnect(accounts[0], provider, signer); // Account changed to a new one or reconnected
//         } else {
//           onDisconnect(); // All accounts disconnected
//         }
//       };

//       // Listen for account changes
//       window.ethereum.on('accountsChanged', handleAccountsChanged);

//       // Check if already connected on component mount
//       window.ethereum.request({ method: 'eth_accounts' })
//         .then(async (accounts: string[]) => {
//           console.log('Initial accounts check:', accounts);
//           if (accounts.length > 0) {
//             // Create provider and signer for initial connection
//             const provider = new ethers.BrowserProvider(window.ethereum);
//             const signer = await provider.getSigner();
//             onConnect(accounts[0], provider, signer); // Already connected
//           } else {
//             onDisconnect(); // Not connected on mount
//           }
//         })
//         .catch((error: any) => {
//           console.error('Error checking initial accounts:', error);
//           onDisconnect(); // Assume disconnected if error
//         });

//       // Cleanup function for the event listener
//       return () => {
//         if (window.ethereum?.removeListener) {
//           window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
//         }
//       };
//     }
//   }, [onConnect, onDisconnect]); // Dependencies: ensure callbacks are always up-to-date

//   return (
//     <div className="flex items-center gap-4">
//       {connected ? ( // Use the 'connected' prop to determine UI
//         <div className="flex items-center gap-2 bg-accent/80 backdrop-blur-sm px-4 py-2 rounded-lg">
//           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//           <span className="font-medium text-sm">
//             {currentAddress ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : 'Connected'}
//           </span>
//           <Button
//             onClick={disconnectWallet}
//             className="ml-2 px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md"
//           >
//             Disconnect
//           </Button>
//         </div>
//       ) : (
//         <Button
//           onClick={connectWallet}
//           disabled={isConnecting}
//           className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
//         >
//           {isConnecting ? 'Connecting...' : 'Connect Wallet'}
//         </Button>
//       )}
//     </div>
//   );
// };
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
    console.log('[WalletConnect] connectWallet: Attempting to connect...');

    if (typeof window.ethereum === 'undefined') {
      console.log('[WalletConnect] connectWallet: MetaMask not found.');
      toast({
        variant: "destructive",
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this feature.",
      });
      return;
    }

    setIsConnecting(true);

    try {
      console.log('[WalletConnect] connectWallet: Requesting eth_requestAccounts...');
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('[WalletConnect] connectWallet: Received accounts:', accounts);

      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        console.log('[WalletConnect] connectWallet: Calling onConnect with:', accounts[0], provider, signer);
        onConnect(accounts[0], provider, signer);
      } else {
        console.log('[WalletConnect] connectWallet: No accounts returned, throwing error.');
        throw new Error('No accounts returned from MetaMask.');
      }
    } catch (error: any) {
      console.error('[WalletConnect] connectWallet: Connection error:', error);
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
      console.log('[WalletConnect] connectWallet: Finished connection attempt.');
    }
  };

  const disconnectWallet = () => {
    console.log('[WalletConnect] disconnectWallet: Calling onDisconnect.');
    onDisconnect();
  };

  useEffect(() => {
    console.log('[WalletConnect] useEffect: Component mounted or dependencies changed.');

    // Check if window.ethereum exists before adding listeners
    if (typeof window.ethereum === 'undefined') {
      console.log('[WalletConnect] useEffect: MetaMask not available on mount. Calling onDisconnect.');
      onDisconnect(); // Ensure disconnected state if MetaMask is not present
      return; // Exit early if no ethereum object
    }

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log('[WalletConnect] handleAccountsChanged: Accounts changed event received:', accounts);
      if (accounts.length > 0) {
        console.log('[WalletConnect] handleAccountsChanged: Accounts found, calling onConnect.');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        onConnect(accounts[0], provider, signer);
      } else {
        console.log('[WalletConnect] handleAccountsChanged: No accounts found, calling onDisconnect.');
        onDisconnect();
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log('[WalletConnect] handleChainChanged: Chain changed to:', chainId);
      // Optional: You might want to re-check connection or prompt user to switch chain
      // For now, just logging. If chain changes to an unsupported one, it might implicitly disconnect.
      // A full dApp would often re-initialize ethers objects here or prompt for chain switch.
    };

    const handleConnect = (connectInfo: any) => {
      console.log('[WalletConnect] handleConnect: Connected to chain ID:', connectInfo.chainId);
      // This fires when MetaMask connects to a chain, not necessarily when accounts are exposed to dApp
    };

    const handleDisconnect = (error: any) => {
      console.log('[WalletConnect] handleDisconnect: Disconnected event received:', error);
      onDisconnect(); // MetaMask explicitly disconnected
    };

    // Add listeners
    console.log('[WalletConnect] useEffect: Adding MetaMask event listeners.');
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('connect', handleConnect);
    window.ethereum.on('disconnect', handleDisconnect);


    // Initial check for already connected accounts
    console.log('[WalletConnect] useEffect: Performing initial eth_accounts check.');
    window.ethereum.request({ method: 'eth_accounts' })
      .then(async (accounts: string[]) => {
        console.log('[WalletConnect] useEffect: Initial eth_accounts result:', accounts);
        if (accounts.length > 0) {
          console.log('[WalletConnect] useEffect: Initial check found accounts, calling onConnect.');
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          onConnect(accounts[0], provider, signer);
        } else {
          console.log('[WalletConnect] useEffect: Initial check found no accounts, calling onDisconnect.');
          onDisconnect();
        }
      })
      .catch((error: any) => {
        console.error('[WalletConnect] useEffect: Error during initial eth_accounts check:', error);
        onDisconnect(); // Assume disconnected if error
      });

    // Cleanup function
    return () => {
      console.log('[WalletConnect] useEffect cleanup: Removing MetaMask event listeners.');
      // --- FIX: Use a check for `window.ethereum` before removing listeners ---
      // This prevents errors if window.ethereum somehow becomes undefined during unmount
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
      // --- END FIX ---
      console.log('[WalletConnect] useEffect cleanup: Listeners removed.');
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
