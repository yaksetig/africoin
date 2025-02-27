
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
  const { toast } = useToast();

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        toast({
          title: "Wallet Connected",
          description: "Your MetaMask wallet has been successfully connected.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "Failed to connect to MetaMask. Please try again.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this feature.",
      });
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || '');
      });
    }
  }, []);

  return (
    <div className="flex items-center gap-4">
      {!account ? (
        <Button 
          onClick={connectWallet}
          className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Connect Wallet
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
