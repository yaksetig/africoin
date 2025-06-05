
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const WalletConnect = () => {
  const [account, setAccount] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

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
      
      // First check if already connected
      const existingAccounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      console.log('Existing accounts:', existingAccounts);
      
      let accounts;
      if (existingAccounts.length > 0) {
        accounts = existingAccounts;
      } else {
        // Request new connection
        accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
      }
      
      console.log('Connected accounts:', accounts);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        toast({
          title: "Wallet Connected",
          description: "Your MetaMask wallet has been successfully connected.",
        });
      } else {
        throw new Error('No accounts returned');
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

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      console.log('Setting up account change listener');
      
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        setAccount(accounts[0] || '');
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Check if already connected on component mount
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          console.log('Initial accounts check:', accounts);
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        })
        .catch((error: any) => {
          console.error('Error checking initial accounts:', error);
        });

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  return (
    <div className="flex items-center gap-4">
      {!account ? (
        <Button 
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      ) : (
        <div className="flex items-center gap-2 bg-accent/80 backdrop-blur-sm px-4 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-medium text-sm">
            {`${account.slice(0, 6)}...${account.slice(-4)}`}
          </span>
        </div>
      )}
    </div>
  );
};
